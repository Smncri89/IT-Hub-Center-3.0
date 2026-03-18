
import { User, Role } from '@/types';
import { supabase } from './supabaseClient';

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
        console.warn('Profile not found after retries. This might happen if the automatic profile creation trigger is missing or failed. Attempting to create a profile as a fallback...');
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

        console.log('Fallback profile created successfully.');
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
        // Add a 10 second timeout to prevent infinite hanging
        const loginPromise = supabase.auth.signInWithPassword({ email, password: pass });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Login request timed out after 10 seconds. Please check your network connection or try again later.')), 10000));
        
        const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

        if (error) {
            if (error.message.includes('AAL2')) {
                return { requires2FA: true };
            }
            if (error.message.includes('Invalid login credentials')) {
                return { error: 'invalid credentials' };
            }
            console.error("Login error:", error);
            return { error: 'invalid credentials' };
        }
        if (!data.user) return { error: 'login failed' };

        const fullUser = await getFullUser(data.user);
        if (!fullUser) return { error: 'profile fetch failed' };

        return { user: fullUser };
    } catch (err: any) {
        console.error('Login exception:', err);
        return { error: err.message || 'An unexpected error occurred during login' };
    }
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
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: {
                name,
                role,
                avatar_url: `https://picsum.photos/seed/${Math.random()}/100/100`
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
