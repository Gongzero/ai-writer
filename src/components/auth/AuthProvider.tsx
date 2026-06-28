"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getAuthRedirectUrl,
  getUserDisplayName,
  isAuthConfigured,
} from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  displayName: string;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isAuthConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("getSession failed:", error);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithProvider = useCallback(async (provider: "google" | "kakao") => {
    if (!configured) return;
    setSigningIn(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      });
      if (error) throw error;
    } catch (e) {
      console.error(`${provider} sign-in failed:`, e);
      setSigningIn(false);
      throw e;
    }
  }, [configured]);

  const signInWithGoogle = useCallback(
    () => signInWithProvider("google"),
    [signInWithProvider]
  );

  const signInWithKakao = useCallback(
    () => signInWithProvider("kakao"),
    [signInWithProvider]
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [configured]);

  const displayName = useMemo(
    () => getUserDisplayName(user?.user_metadata, user?.email),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading: loading || signingIn,
      user,
      session,
      displayName,
      signInWithGoogle,
      signInWithKakao,
      signOut,
    }),
    [
      configured,
      loading,
      signingIn,
      user,
      session,
      displayName,
      signInWithGoogle,
      signInWithKakao,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
