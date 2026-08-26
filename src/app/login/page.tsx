"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, Mail, Lock, LogIn, ArrowRight, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import RegisterSuccessModal from "@/components/auth/RegisterSuccessModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithEmail, loginWithGoogle, loginAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    const isRegistered = searchParams.get("registered");
    const registeredEmailParam = searchParams.get("email");

    if (isRegistered === "true") {
      setIsSuccessModalOpen(true);
      if (registeredEmailParam) {
        setEmail(registeredEmailParam);
        setRegisteredEmail(registeredEmailParam);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const res = await loginWithEmail(email, password);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.push("/app");
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    router.push("/app");
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 transition-colors duration-300 p-4 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center max-w-md w-full mx-auto pt-2">
        <Link href="/" className="flex items-center gap-2 font-mono font-bold tracking-tighter text-lg">
          <div className="w-8 h-8 rounded-lg bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <span>Jejak.log</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white/80 dark:bg-mono-900/80 backdrop-blur-md border border-mono-200 dark:border-mono-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Masuk ke Jejak.log</h1>
            <p className="text-sm text-mono-500 dark:text-mono-400 mt-1">
              Buka arsip eksplorasi dan peta digital personal Anda
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-mono-200 dark:border-mono-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-mono-900 text-xs text-mono-400 uppercase tracking-widest font-mono">
              atau
            </span>
          </div>

          {/* Alternative Logins */}
          <div className="space-y-2.5">
            {/* Guest Demo Login Button */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 bg-mono-900/5 dark:bg-mono-100/5 hover:bg-mono-900/10 dark:hover:bg-mono-100/10 text-mono-700 dark:text-mono-300 font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 border border-dashed border-mono-300 dark:border-mono-700"
            >
              <ShieldCheck className="w-4 h-4 text-mono-500" />
              <span>Masuk Mode Demo (Tanpa Register)</span>
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-mono-500 dark:text-mono-400">
              Belum punya akun?{" "}
              <Link href="/register" className="font-semibold text-mono-900 dark:text-mono-100 hover:underline">
                Daftar Sekarang <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Registration Success Popup Modal */}
      <RegisterSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onContinue={() => setIsSuccessModalOpen(false)}
        userEmail={registeredEmail}
      />

      {/* Footer */}
      <footer className="text-center text-xs text-mono-400 font-mono pb-2">
        Jejak.log &copy; {new Date().getFullYear()} — Arsip Eksplorasi Monokrom
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-xs">Memuat login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
