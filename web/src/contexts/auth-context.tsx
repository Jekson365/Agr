import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getAuthToken, setAuthToken } from '@/services/api-client';
import * as authService from '@/services/auth-service';
import { clearSession, loadSession, saveSession } from '@/services/token-storage';
import type {
  PhoneRegisterRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '@/types/auth';

type AuthContextValue = {
  /** True until the persisted session has been read on startup. */
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (request: RegisterRequest) => Promise<void>;
  /** The same two, for an account whose identity is its phone number rather than an email. */
  signInWithPhone: (phoneNumber: string, password: string) => Promise<void>;
  signUpWithPhone: (request: PhoneRegisterRequest) => Promise<void>;
  /** Exchanges a Google ID token for a session; registers the account on first sign-in. */
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (request: UpdateProfileRequest) => Promise<void>;
  /** Re-fetches the current user (e.g. to pick up storage usage after uploads made elsewhere). */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Restore a persisted session on startup.
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setAuthToken(session.token);
      setUser(session.user);
    }
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      user,
      signIn: async (email, password) => {
        const session = await authService.login({ email, password });
        setAuthToken(session.token);
        saveSession(session);
        setUser(session.user);
      },
      signUp: async (request) => {
        const session = await authService.register(request);
        setAuthToken(session.token);
        saveSession(session);
        setUser(session.user);
      },
      signInWithPhone: async (phoneNumber, password) => {
        const session = await authService.loginByPhone({ phoneNumber, password });
        setAuthToken(session.token);
        saveSession(session);
        setUser(session.user);
      },
      signUpWithPhone: async (request) => {
        const session = await authService.registerByPhone(request);
        setAuthToken(session.token);
        saveSession(session);
        setUser(session.user);
      },
      signInWithGoogle: async (idToken) => {
        const session = await authService.googleSignIn({ idToken });
        setAuthToken(session.token);
        saveSession(session);
        setUser(session.user);
      },
      signOut: () => {
        setUser(null);
        setAuthToken(null);
        clearSession();
      },
      updateProfile: async (request) => {
        const updated = await authService.updateProfile(request);
        const token = getAuthToken();
        if (token) {
          saveSession({ token, user: updated });
        }
        setUser(updated);
      },
      refreshUser: async () => {
        if (!getAuthToken()) return;
        const current = await authService.getCurrentUser();
        const token = getAuthToken();
        if (token) {
          saveSession({ token, user: current });
        }
        setUser(current);
      },
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
