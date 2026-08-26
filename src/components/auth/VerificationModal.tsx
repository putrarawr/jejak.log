"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, X, RefreshCw, ShieldAlert } from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResendEmail?: () => Promise<{ error?: string; success?: string }>;
}

export default function VerificationModal({
  isOpen,
  onClose,
  email,
  onResendEmail,
}: VerificationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string>("");

  if (!isOpen) return null;

  const handleResend = async () => {
    if (!onResendEmail) return;
    setIsResending(true);
    setResendStatus("");
    const res = await onResendEmail();
    setIsResending(false);

    if (res.error) {
      setResendStatus(`Error: ${res.error}`);
    } else {
      setResendStatus("Email verifikasi berhasil dikirim ulang! Silakan periksa inbox/spam.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mono-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="w-14 h-14 rounded-2xl bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Mail className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-mono-900 dark:text-mono-100 mb-2">
          Verifikasi Email Diperlukan
        </h3>

        <p className="text-xs text-mono-600 dark:text-mono-400 leading-relaxed mb-4">
          Kami telah mengirimkan tautan konfirmasi verifikasi ke alamat email:
        </p>

        <div className="px-3 py-2 bg-mono-100 dark:bg-mono-800/80 rounded-xl font-mono text-xs font-semibold text-mono-900 dark:text-mono-100 mb-4 break-all border border-mono-200 dark:border-mono-700">
          {email || "email Anda"}
        </div>

        <p className="text-xs text-mono-500 dark:text-mono-400 leading-relaxed mb-3">
          Silakan buka inbox atau folder <strong>Spam / Promosi</strong> di email Anda dan klik link verifikasi untuk mengaktifkan akun.
        </p>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 text-left mb-5">
          <p className="font-semibold mb-0.5">Tips Pengujian di HP (Network IP):</p>
          <p>
            Link verifikasi Supabase telah dikonfigurasi mengikuti lokasi network HP Anda. Jika email bawaan Supabase tertahan filter spam/rate limit, Anda dapat menggunakan <strong>Mode Demo</strong> untuk menguji seluruh fitur langsung.
          </p>
        </div>

        {resendStatus && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-mono border ${
            resendStatus.startsWith("Error")
              ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}>
            {resendStatus}
          </div>
        )}

        <div className="space-y-2.5">
          {onResendEmail && (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full py-2.5 px-4 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-900 dark:text-mono-100 font-medium rounded-xl text-xs transition flex items-center justify-center gap-2 border border-mono-200 dark:border-mono-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>{isResending ? "Mengirim ulang..." : "Kirim Ulang Link Verifikasi"}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-medium rounded-xl text-xs transition shadow"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
