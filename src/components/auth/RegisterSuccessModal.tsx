"use client";

import React from "react";
import { CheckCircle2, ArrowRight, X } from "lucide-react";

interface RegisterSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  userEmail?: string;
}

export default function RegisterSuccessModal({
  isOpen,
  onClose,
  onContinue,
  userEmail,
}: RegisterSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mono-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-mono-900 dark:text-mono-100 mb-2">
          Pendaftaran Berhasil!
        </h3>

        <p className="text-xs text-mono-600 dark:text-mono-400 leading-relaxed mb-4">
          Akun Anda telah berhasil dibuat. Silakan masuk untuk mulai mencatat singgahan dan foto tempat favorit Anda.
        </p>

        {userEmail && (
          <div className="px-3 py-2 bg-mono-100 dark:bg-mono-800/80 rounded-xl font-mono text-xs font-semibold text-mono-900 dark:text-mono-100 mb-5 break-all border border-mono-200 dark:border-mono-700">
            {userEmail}
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3 px-4 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
        >
          <span>Masuk ke Akun Saya</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
