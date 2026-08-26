"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, Mail, Lock, User, AtSign, UserPlus, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const res = await registerWithEmail(email, password, username, displayName || username);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);
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

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white/80 dark:bg-mono-900/80 backdrop-blur-md border border-mono-200 dark:border-mono-800 rounded-2xl p-6 sm:p-8 shadow-xl">
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
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-4 py-2 bg-mono-100/50 dark:bg-mono-950/50 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Mendaftarkan...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-mono-200 dark:border-mono-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-mono-900 text-xs text-mono-400 uppercase tracking-widest font-mono">
              atau
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const guestUser = {
                id: "guest-demo-user-id",
                email: "guest@jejaklog.app",
                username: "petualang_guest",
                displayName: "Penjelajah Demo",
                isGuest: true,
              };
              localStorage.setItem("jejaklog_guest_user", JSON.stringify(guestUser));
              router.push("/app");
            }}
            className="w-full py-2.5 px-4 bg-mono-900/5 dark:bg-mono-100/5 hover:bg-mono-900/10 dark:hover:bg-mono-100/10 text-mono-700 dark:text-mono-300 font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 border border-dashed border-mono-300 dark:border-mono-700"
          >
            <span>Masuk Mode Demo (Tanpa Register)</span>
          </button>

          <div className="text-center mt-6">
            <p className="text-xs text-mono-500 dark:text-mono-400">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-mono-900 dark:text-mono-100 hover:underline">
                Masuk Sekarang <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-mono-400 font-mono pb-2">
        Jejak.log &copy; {new Date().getFullYear()} — Personal Digital Exploration
      </footer>
    </main>
  );
}
