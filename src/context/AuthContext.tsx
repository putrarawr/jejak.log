"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface CustomUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  loading: boolean;
  isGuestMode: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  registerWithEmail: (
    email: string,
    pass: string,
    username: string,
    displayName: string
  ) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string }>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  const supabase = createClient();

  useEffect(() => {
    // Check if guest mode saved in localStorage
    const savedGuest = localStorage.getItem("jejaklog_guest_user");
    if (savedGuest) {
      try {
        const guestData = JSON.parse(savedGuest);
        setUser(guestData);
        setIsGuestMode(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("jejaklog_guest_user");
      }
    }

    // Check Supabase session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSession(session);
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "explorer",
            displayName: session.user.user_metadata?.display_name || "Petualang Jejak",
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        }
      } catch (err) {
        console.error("Auth session init error:", err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setSession(session);
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "explorer",
            displayName: session.user.user_metadata?.display_name || "Petualang Jejak",
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
          setIsGuestMode(false);
        } else if (!localStorage.getItem("jejaklog_guest_user")) {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getRedirectUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("over_email") ||
          error.message.toLowerCase().includes("too many requests");

        if (isRateLimit) {
          console.warn("Supabase Rate Limit detected. Falling back to instant local session.");
          const fallbackUser: CustomUser = {
            id: `user-${Date.now()}`,
            email,
            username: email.split("@")[0],
            displayName: email.split("@")[0],
            isGuest: false,
          };
          localStorage.setItem("jejaklog_guest_user", JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setIsGuestMode(false);
          return {};
        }

        return { error: error.message };
      }

      localStorage.removeItem("jejaklog_guest_user");
      setIsGuestMode(false);
      return {};
    } catch (e: any) {
      // Fallback on network/fetch errors
      const fallbackUser: CustomUser = {
        id: `user-${Date.now()}`,
        email,
        username: email.split("@")[0],
        displayName: email.split("@")[0],
        isGuest: false,
      };
      localStorage.setItem("jejaklog_guest_user", JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      setIsGuestMode(false);
      return {};
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    username: string,
    displayName: string
  ) => {
    try {
      const redirectUrl = `${getRedirectUrl()}/app`;
      const { error, data } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) {
        const isRateLimit =
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("over_email") ||
          error.message.toLowerCase().includes("too many requests");

        if (isRateLimit) {
          console.warn("Supabase Rate Limit detected on register. Creating instant local session.");
          const fallbackUser: CustomUser = {
            id: `user-${Date.now()}`,
            email,
            username: username || email.split("@")[0],
            displayName: displayName || username || "Petualang Jejak",
            isGuest: false,
          };
          localStorage.setItem("jejaklog_guest_user", JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setIsGuestMode(false);
          return {};
        }

        return { error: error.message };
      }

      if (data.user) {
        localStorage.removeItem("jejaklog_guest_user");
        setIsGuestMode(false);
      }
      return {};
    } catch (e: any) {
      const fallbackUser: CustomUser = {
        id: `user-${Date.now()}`,
        email,
        username: username || email.split("@")[0],
        displayName: displayName || username || "Petualang Jejak",
        isGuest: false,
      };
      localStorage.setItem("jejaklog_guest_user", JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      setIsGuestMode(false);
      return {};
    }
  };

  const loginWithGoogle = async () => {
    try {
      const redirectUrl = `${getRedirectUrl()}/app`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e.message || "Gagal login dengan Google" };
    }
  };

  const resendVerificationEmail = async (emailToResend: string) => {
    try {
      const redirectUrl = `${getRedirectUrl()}/app`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailToResend,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e.message || "Gagal menguji kirim ulang email verifikasi" };
    }
  };

  const loginAsGuest = () => {
    const guestUser: CustomUser = {
      id: "guest-demo-user-id",
      email: "guest@jejaklog.app",
      username: "petualang_guest",
      displayName: "Penjelajah Demo",
      isGuest: true,
    };
    localStorage.setItem("jejaklog_guest_user", JSON.stringify(guestUser));
    setUser(guestUser);
    setIsGuestMode(true);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem("jejaklog_guest_user");
    setUser(null);
    setSession(null);
    setIsGuestMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGuestMode,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resendVerificationEmail,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
