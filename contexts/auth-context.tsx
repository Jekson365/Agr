import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getAuthToken, setAuthToken } from '@/services/api-client';
import * as authService from '@/services/auth-service';
import { clearSession, loadSession, saveSession } from '@/services/token-storage';
import type { RegisterRequest, UpdateProfileRequest, User } from '@/types/auth';

type AuthContextValue = {
  /** True until the persisted session has been read on startup. */
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (request: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (request: UpdateProfileRequest) => Promise<void>;
  /** Re-fetches the current user (e.g. to pick up storage usage after uploads made elsewhere). */
  refreshUser: () => Promise<void>;
  /** True for one render right after signIn/signUp (not after a restored session) — drives the
   * post-login greeting popup. Call acknowledgeSignIn() once consumed so it doesn't fire again. */
  justSignedIn: boolean;
  acknowledgeSignIn: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [justSignedIn, setJustSignedIn] = useState(false);

  // Restore a persisted session on startup.
  useEffect(() => {
    (async () => {
      try {
        const session = await loadSession();
        if (session) {
          setAuthToken(session.token);
          setUser(session.user);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      user,
      signIn: async (email, password) => {
        const session = await authService.login({ email, password });
        setAuthToken(session.token);
        await saveSession(session);
        setUser(session.user);
        setJustSignedIn(true);
      },
      signUp: async (request) => {
        const session = await authService.register(request);
        setAuthToken(session.token);
        await saveSession(session);
        setUser(session.user);
        setJustSignedIn(true);
      },
      signOut: async () => {
        setUser(null);
        setAuthToken(null);
        await clearSession();
      },
      updateProfile: async (request) => {
        const updated = await authService.updateProfile(request);
        const token = getAuthToken();
        if (token) {
          await saveSession({ token, user: updated });
        }
        setUser(updated);
      },
      refreshUser: async () => {
        if (!getAuthToken()) return;
        const current = await authService.getCurrentUser();
        const token = getAuthToken();
        if (token) {
          await saveSession({ token, user: current });
        }
        setUser(current);
      },
      justSignedIn,
      acknowledgeSignIn: () => setJustSignedIn(false),
    }),
    [isLoading, user, justSignedIn]
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
