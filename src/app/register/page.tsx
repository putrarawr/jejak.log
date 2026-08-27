"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, Mail, Lock, User, AtSign, ArrowRight, CheckCircle2, RefreshCw, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { toast } from "sonner";

import CaptchaWidget from "@/components/auth/CaptchaWidget";

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail, resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    const res = await registerWithEmail(email, password, username, displayName || username);

    if (res.error) {
      setLoading(false);
      setErrorMsg(res.error);
    } else if (res.requiresVerification) {
      setLoading(false);
      setRegisteredEmail(res.email || email);
      setIsVerificationStep(true);
    } else {
      toast.success("Akun berhasil dibuat! Mengarahkan ke dashboard...");
      router.push("/app");
    }
  };

  const handleResendEmail = async () => {
    if (!registeredEmail || isResending) return;
    setIsResending(true);
    const res = await resendVerificationEmail(registeredEmail);
    setIsResending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Email verifikasi telah dikirim ulang.");
    }
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

      {/* Main Form Card / Verification Notice */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white/80 dark:bg-mono-900/80 backdrop-blur-md border border-mono-200 dark:border-mono-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {isVerificationStep ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Mail className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Verifikasi Email Dikirim</h1>
                <p className="text-xs text-mono-600 dark:text-mono-400 leading-relaxed">
                  Pesan konfirmasi pendaftaran telah dikirim ke:
                </p>
                <p className="font-mono text-sm font-bold text-mono-900 dark:text-mono-100">
                  {registeredEmail}
                </p>
              </div>

              <p className="text-xs text-mono-500 dark:text-mono-400 leading-relaxed bg-mono-100 dark:bg-mono-800/60 p-3 rounded-xl border border-mono-200 dark:border-mono-700">
                Silakan buka kotak masuk atau folder spam email Anda, lalu klik tautan konfirmasi untuk mengaktifkan akun.
              </p>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-2.5 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 text-mono-800 dark:text-mono-200 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                  <span>Kirim Ulang Email Verifikasi</span>
                </button>

                <Link
                  href="/login"
                  className="w-full py-2.5 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition block text-center"
                >
                  <span>Masuk ke Halaman Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
                <p className="text-sm text-mono-500 dark:text-mono-400 mt-1">
                  Mulai arsipkan perjalanan dan spot favorit Anda
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                    Username (Unik)
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                    <input
                      type="text"
                      required
                      pattern="[a-zA-Z0-9_]+"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                      placeholder="putra_explorer"
                      className="w-full pl-10 pr-4 py-2 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                    Nama Tampilan
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Putra Nugraha"
                      className="w-full pl-10 pr-4 py-2 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
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
                      className="w-full pl-10 pr-4 py-2 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                    Kata Sandi (Min 8 Karakter)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-2 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-400 hover:text-mono-700 dark:hover:text-mono-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-2 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-400 hover:text-mono-700 dark:hover:text-mono-200 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA Security Protection */}
                <CaptchaWidget onVerify={setIsCaptchaVerified} />

                <button
                  type="submit"
                  disabled={loading || !isCaptchaVerified}
                  className="w-full py-2.5 mt-2 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-mono text-sm font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Mendaftarkan..."
                  ) : (
                    <>
                      <span>Daftar Akun Baru</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-mono-500 dark:text-mono-400">
                Sudah memiliki akun?{" "}
                <Link
                  href="/login"
                  className="font-bold text-mono-900 dark:text-mono-100 hover:underline"
                >
                  Masuk Akun
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
