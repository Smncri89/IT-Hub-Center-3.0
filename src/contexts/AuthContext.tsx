
import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, Role, UserStatus } from '@/types';
import * as authService from '@/services/auth';
import * as api from '@/services/api';
import { supabase } from '@/services/supabaseClient';
import Spinner from '@/components/Spinner';

type LoginResult = { user?: User; error?: string; requires2FA?: boolean };

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  status: UserStatus;
  setUserStatus: (status: UserStatus) => void;
  login: (email: string, pass: string) => Promise<LoginResult>;
  verify2FA: (token: string) => Promise<{ user?: User; error?: string }>;
  register: (name: string, email: string, pass: string, role: Role) => Promise<{ user: any | null; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<UserStatus>(UserStatus.Online);
  
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const inactivityTimer = useRef<number | null>(null);
  const INACTIVITY_TIMEOUT = 1000 * 60 * 60; // 1 hour

  const logoutAndClearTimer = useCallback(() => {
    if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
    }
    authService.logout();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = window.setTimeout(logoutAndClearTimer, INACTIVITY_TIMEOUT);
  }, [INACTIVITY_TIMEOUT, logoutAndClearTimer]);

  useEffect(() => {
    if (!user) return;

    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    const handleActivity = () => {
        if (status === UserStatus.Away) {
            setStatus(UserStatus.Online);
        }
        resetInactivityTimer();
    };

    activityEvents.forEach(event => window.addEventListener(event, handleActivity));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user, status, resetInactivityTimer]);

  useEffect(() => {
    let mounted = true;
    let initComplete = false;

    // 1. Force Loading Stop Safety Valve
    const safetyTimeout = setTimeout(() => {
        if (mounted && !initComplete) {
            console.warn("Auth initialization timed out. Forcing app load.");
            setLoading(false);
            initComplete = true;
        }
    }, 3000); // 3 seconds max wait

    // 2. Initial Session Check
    const initializeAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;

            if (session?.user) {
                const fullUser = await authService.getFullUser(session.user);
                if (mounted && fullUser) {
                    setUser(fullUser);
                    setStatus(UserStatus.Online);
                } else if (mounted && !fullUser) {
                     // Session exists but profile fetch failed? Force logout to be clean.
                     await authService.logout();
                     setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth init error:", error);
            if (mounted) setUser(null);
        } finally {
            if (mounted) {
                setLoading(false);
                initComplete = true;
                clearTimeout(safetyTimeout);
            }
        }
    };

    initializeAuth();

    // 3. Real-time Auth Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        const authUser = session?.user ?? null;
        
        // Avoid redundant updates if user ID hasn't changed
        if (authUser?.id === userRef.current?.id) return;

        if (event === 'SIGNED_OUT') {
            if (mounted) setUser(null);
        } else if (authUser) {
            // CRITICAL FIX: Do NOT set loading=true here. 
            // Background updates should happen silently without blocking the UI.
            try {
                const newCurrentUser = await authService.getFullUser(authUser);
                if (mounted) {
                    setUser(newCurrentUser);
                    if (newCurrentUser) setStatus(UserStatus.Online);
                }
            } catch (e) {
                console.error("Auth state change error", e);
            }
        }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<LoginResult> => {
    const result = await authService.login(email, pass);
    return result;
  }, []);
  
  const verify2FA = useCallback(async (token: string): Promise<{ user?: User; error?: string }> => {
    const result = await authService.verify2FA(token);
    return result;
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string, role: Role): Promise<{ user: any | null; error?: string }> => {
    return await authService.register(name, email, pass, role);
  }, []);

  const setUserStatus = useCallback((newStatus: UserStatus) => {
    setStatus(newStatus);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const logout = useCallback(() => {
    logoutAndClearTimer();
  }, [logoutAndClearTimer]);
  
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    try {
      await api.updateUser(user.id, updates);
      // Refresh local user state
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
          const freshFullUser = await authService.getFullUser(authUser);
          setUser(freshFullUser);
      }
    } catch (error: any) {
      console.error("updateUser error:", error.message || error);
      throw error;
    }
  }, [user]);

  const value = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    status,
    setUserStatus,
    login,
    verify2FA,
    register,
    logout,
    updateUser,
  }), [user, status, login, verify2FA, register, logout, setUserStatus, updateUser]);
  
  if (loading) {
      return (
        <div className="flex justify-center items-center h-screen bg-neutral-100 dark:bg-neutral-900">
            <Spinner size="lg" />
        </div>
      );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
