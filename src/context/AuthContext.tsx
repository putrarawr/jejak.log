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
  ) => Promise<{ error?: string; requiresVerification?: boolean; email?: string }>;
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
        console.warn("Auth session init network issue:", err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    let subscription: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
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
      });
      subscription = data?.subscription;
    } catch (e) {
      console.warn("Failed to subscribe to auth state changes:", e);
      setLoading(false);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const getRedirectUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SITE_URL || "https://jejak-log.web.id";
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("not confirmed") || msg.includes("email_not_confirmed") || msg.includes("unconfirmed")) {
          return {
            error: "Email Anda belum diverifikasi. Silakan periksa kotak masuk/spam email Anda untuk melakukan verifikasi akun sebelum masuk.",
          };
        }

        if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
          return { error: "Email atau kata sandi tidak valid. Silakan periksa kembali." };
        }

        if (msg.includes("failed to fetch") || msg.includes("fetch") || msg.includes("network")) {
          return {
            error: "Gagal terhubung ke server Supabase. Pastikan koneksi internet stabil atau variabel environment NEXT_PUBLIC_SUPABASE_URL & ANON_KEY di Vercel sudah aktif.",
          };
        }

        return { error: error.message };
      }

      localStorage.removeItem("jejaklog_guest_user");
      setIsGuestMode(false);

      if (data?.session?.user) {
        // Upsert user row to database
        try {
          await supabase.from("users").upsert({
            id: data.session.user.id,
            email: cleanEmail,
            username: data.session.user.user_metadata?.username || cleanEmail.split("@")[0],
            display_name: data.session.user.user_metadata?.display_name || cleanEmail.split("@")[0],
          });
        } catch (e) {}
      }

      return {};
    } catch (e: any) {
      return { error: e.message || "Gagal masuk. Silakan coba beberapa saat lagi." };
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    username: string,
    displayName: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (pass.length < 8) {
      return { error: "Kata sandi minimal harus terdiri dari 8 karakter." };
    }

    try {
      const redirectUrl = `${getRedirectUrl()}/login?verified=true`;
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: pass,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: normalizedUsername,
            display_name: displayName || normalizedUsername,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already in use") || msg.includes("already exists")) {
          return { error: "Alamat email ini sudah terdaftar. Silakan masuk ke akun Anda." };
        }

        if (msg.includes("failed to fetch") || msg.includes("fetch") || msg.includes("network")) {
          return {
            error: "Gagal terhubung ke server Supabase. Pastikan koneksi internet Anda aktif dan variabel environment NEXT_PUBLIC_SUPABASE_URL & ANON_KEY sudah terpasang di Vercel.",
          };
        }

        return { error: error.message };
      }

      // Check if email confirmation is required by Supabase auth
      if (data?.user && !data.session) {
        return {
          requiresVerification: true,
          email: normalizedEmail,
        };
      }

      return {};
    } catch (e: any) {
      return { error: e.message || "Gagal mendaftar. Silakan periksa koneksi Anda." };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: `${getRedirectUrl()}/login?verified=true`,
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (e: any) {
      return { error: e.message || "Gagal mengirim email verifikasi." };
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
      return { error: e.message || "Gagal masuk dengan Google." };
    }
  };

  const loginAsGuest = () => {
    const guestUser: CustomUser = {
      id: `guest-${Date.now()}`,
      email: "demo@jejak-log.web.id",
      username: "petualang_demo",
      displayName: "Petualang Demo",
      isGuest: true,
    };

    localStorage.setItem("jejaklog_guest_user", JSON.stringify(guestUser));
    setUser(guestUser);
    setSession(null);
    setIsGuestMode(true);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
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
