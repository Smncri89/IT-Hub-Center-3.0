
import { User, Role } from '@/types';
import { supabase } from './supabaseClient';
import { logAuditEvent } from './auditService';

// --- Password Policy ---
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

export const validatePassword = (password: string): string | null => {
    if (password.length < PASSWORD_MIN_LENGTH) return 'password_min_12';
    if (!/[a-z]/.test(password)) return 'password_needs_lowercase';
    if (!/[A-Z]/.test(password)) return 'password_needs_uppercase';
    if (!/\d/.test(password)) return 'password_needs_number';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'password_needs_special';
    return null;
};

// --- Account Lockout ---
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_STORAGE_KEY = 'it_hub_login_attempts';

interface LockoutEntry { attempts: number; lockedUntil: number | null; }

const getLockoutEntry = (email: string): LockoutEntry => {
    try {
        const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        return data[email] || { attempts: 0, lockedUntil: null };
    } catch { return { attempts: 0, lockedUntil: null }; }
};

const setLockoutEntry = (email: string, entry: LockoutEntry) => {
    try {
        const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        data[email] = entry;
        localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage full, ignore */ }
};

const clearLockout = (email: string) => {
    try {
        const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        delete data[email];
        localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
};

// Helper to get user profile and merge with auth data
export const getFullUser = async (authUser: any): Promise<User | null> => {
    if (!authUser) return null;

    let profile;
    let attempts = 0;
    const maxAttempts = 3;

    // Retry logic to handle potential race condition between user signup and profile creation trigger.
    while (attempts < maxAttempts) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (data) {
            profile = data;
            break; // Profile found, exit loop.
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 means "row not found" which is fine here.
            console.error('Error fetching profile. RLS policy might be missing or incorrect for SELECT.', error);
            return null; // Hard error, abort.
        }

        attempts++;
        if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempts)); // Wait 0.5s, then 1s
        }
    }

    if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: authUser.id,
                name: authUser.user_metadata?.name || authUser.email,
                email: authUser.email,
                role: Role.EndUser,
                avatar_url: `https://picsum.photos/seed/${authUser.id}/100/100`,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating profile. This is likely due to a missing or incorrect RLS policy for INSERT on the `profiles` table. Please ensure the `handle_new_user` trigger and function are correctly set up in your Supabase project.', insertError);
            return null;
        }

        profile = newProfile;
    }

    return {
        id: authUser.id,
        name: profile.name,
        email: authUser.email,
        role: profile.role,
        company: profile.company,
        avatarUrl: profile.avatar_url,
        isTwoFactorEnabled: profile.is_two_factor_enabled,
        twoFactorSecret: profile.two_factor_secret,
        statusMessage: profile.status_message,
        statusMessageTimestamp: profile.status_message_timestamp,
        signatureText: profile.signature_text,
        signatureLogo: profile.signature_logo,
        weekStart: profile.week_start,
        timeFormat: profile.time_format,
        dateFormat: profile.date_format,
        muteUntil: profile.mute_until,
        muteWeekends: profile.mute_weekends,
        muteOutsideHours: profile.mute_outside_hours,
        quietHoursStart: profile.quiet_hours_start,
        quietHoursEnd: profile.quiet_hours_end,
        loginEnabled: profile.login_enabled !== false,
    };
};

export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error getting session:", error);
        return null;
    }
    if (!session) return null;
    return getFullUser(session.user);
};

export const login = async (email: string, pass: string): Promise<{ user?: User; error?: string; requires2FA?: boolean }> => {
    try {
        // Account lockout check
        const lockout = getLockoutEntry(email);
        if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
            const minutesLeft = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
            return { error: `account_locked:${minutesLeft}` };
        }
        if (lockout.lockedUntil && Date.now() >= lockout.lockedUntil) {
            clearLockout(email);
        }

        const loginPromise = supabase.auth.signInWithPassword({ email, password: pass });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Login request timed out after 10 seconds. Please check your network connection or try again later.')), 10000));

        const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

        if (error) {
            if (error.message.includes('AAL2')) {
                clearLockout(email);
                return { requires2FA: true };
            }

            // Track failed attempt
            const current = getLockoutEntry(email);
            const newAttempts = current.attempts + 1;
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                setLockoutEntry(email, { attempts: newAttempts, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
                logFailedLogin(email, `Account locked after ${newAttempts} failed attempts`);
                return { error: `account_locked:15` };
            } else {
                setLockoutEntry(email, { attempts: newAttempts, lockedUntil: null });
                logFailedLogin(email, `Failed login attempt ${newAttempts}/${MAX_LOGIN_ATTEMPTS}`);
            }

            return { error: 'invalid credentials' };
        }
        if (!data.user) return { error: 'login failed' };

        // Successful login — clear lockout
        clearLockout(email);

        const fullUser = await getFullUser(data.user);
        if (!fullUser) return { error: 'profile fetch failed' };

        return { user: fullUser };
    } catch (err: any) {
        console.error('Login exception:', err);
        return { error: err.message || 'An unexpected error occurred during login' };
    }
};

const logFailedLogin = (email: string, details: string) => {
    logAuditEvent({
        userId: 'anonymous',
        userName: email,
        action: 'login' as const,
        entityType: 'system' as const,
        entityName: 'Failed Login',
        details,
    }).catch(() => {});
};

export const verify2FA = async (token: string): Promise<{ user?: User; error?: string }> => {
    try {
        const verifyPromise = supabase.auth.verifyOtp({
            type: 'totp',
            token,
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('2FA verification timed out after 10 seconds.')), 10000));
        
        const { data: { session }, error: verifyError } = await Promise.race([verifyPromise, timeoutPromise]) as any;

        if (verifyError) {
            console.error("2FA verification failed:", verifyError);
            return { error: 'invalid 2fa code' };
        }
        if (!session?.user) {
            return { error: 'invalid 2fa code' };
        }

        const fullUser = await getFullUser(session.user);
        if (!fullUser) return { error: 'profile fetch failed' };

        return { user: fullUser };
    } catch (err: any) {
        console.error('2FA verification exception:', err);
        return { error: err.message || 'An unexpected error occurred during 2FA verification' };
    }
};


export const register = async (name: string, email: string, pass: string, role: Role): Promise<{ user: any | null; error?: string }> => {
    const passwordError = validatePassword(pass);
    if (passwordError) return { user: null, error: passwordError };

    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: {
                name,
                role,
                avatar_url: `https://picsum.photos/seed/${crypto.randomUUID()}/100/100`
            }
        }
    });

    if (error) {
        if (error.message.includes("User already registered")) {
            return { user: null, error: 'email already exists' };
        }
        console.error("Registration error:", error);
        return { user: null, error: 'registration failed' };
    }
    
    return { user: data.user };
};

export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    }
};

export const sendPasswordResetEmail = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '#/update-password',
    });
    if (error) {
        console.error("Password reset error:", error);
        return { error: 'unexpected error' };
    }
    return {};
};
