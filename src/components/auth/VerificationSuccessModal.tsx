"use client";

import React from "react";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

interface VerificationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationSuccessModal({
  isOpen,
  onClose,
}: VerificationSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>Akun Aktif Sepenuhnya</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-mono-900 dark:text-mono-100">
            Email Berhasil Diverifikasi!
          </h2>

          <p className="text-xs text-mono-600 dark:text-mono-400 leading-relaxed pt-1">
            Selamat, konfirmasi email Anda berhasil. Akun Anda telah aktif dan siap digunakan untuk mengarsipkan peta eksplorasi.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-2xl transition shadow flex items-center justify-center gap-2"
        >
          <span>Masuk Akun Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
