"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, Mail, Lock, LogIn, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { toast } from "sonner";

import CaptchaWidget from "@/components/auth/CaptchaWidget";
import VerificationSuccessModal from "@/components/auth/VerificationSuccessModal";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithEmail, loginAsGuest, resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const isVerifiedParam = searchParams.get("verified") === "true";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isSignupType =
      searchParams.get("type") === "signup" ||
      hash.includes("type=signup") ||
      hash.includes("access_token");

    if (isVerifiedParam || isSignupType) {
      setIsSuccessModalOpen(true);
      toast.success("Email Anda berhasil diverifikasi!");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setShowResendButton(false);
    setLoading(true);

    const res = await loginWithEmail(email, password);

    if (res.error) {
      setLoading(false);
      setErrorMsg(res.error);
      if (res.error.toLowerCase().includes("verifikasi") || res.error.toLowerCase().includes("dikonfirmasi")) {
        setShowResendButton(true);
      }
    } else {
      toast.success("Berhasil masuk! Mengarahkan ke dashboard...");
      // Keep loading as true while router push happens
      router.push("/app");
    }
  };

  const handleResendVerification = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    const res = await resendVerificationEmail(email);
    setIsResending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Email verifikasi telah dikirim ulang.");
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
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono space-y-2">
              <p>{errorMsg}</p>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg font-mono text-[10px] uppercase font-bold flex items-center gap-1 hover:bg-red-700 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                  <span>Kirim Ulang Email Verifikasi</span>
                </button>
              )}
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

            {/* CAPTCHA Security Protection */}
            <CaptchaWidget onVerify={setIsCaptchaVerified} />

            <button
              type="submit"
              disabled={loading || !isCaptchaVerified}
              className="w-full py-3 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-mono text-sm font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Memverifikasi..."
              ) : (
                <>
                  <span>Masuk Akun</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-mono-200 dark:border-mono-800" />
            </div>
            <div className="relative flex justify-center text-xs font-mono uppercase">
              <span className="bg-white dark:bg-mono-900 px-3 text-mono-400">Atau</span>
            </div>
          </div>

          {/* Guest Mode Entry */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-800 dark:text-mono-200 font-mono text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Coba Dalam Mode Demo (Tanpa Login)</span>
          </button>

          <div className="mt-6 text-center text-xs text-mono-500 dark:text-mono-400">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-bold text-mono-900 dark:text-mono-100 hover:underline"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>

      {/* Verification Success Modal */}
      <VerificationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs text-mono-400">
          Memuat...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
