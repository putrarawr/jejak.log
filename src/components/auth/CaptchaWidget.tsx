"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react";

interface CaptchaWidgetProps {
  onVerify: (isValid: boolean) => void;
}

export default function CaptchaWidget({ onVerify }: CaptchaWidgetProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(false);

  const generateChallenge = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer("");
    setIsVerified(false);
    setError(false);
    onVerify(false);
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    setError(false);

    if (parseInt(val.trim(), 10) === num1 + num2) {
      setIsVerified(true);
      onVerify(true);
    } else {
      setIsVerified(false);
      onVerify(false);
      if (val.length >= String(num1 + num2).length) {
        setError(true);
      }
    }
  };

  return (
    <div className="p-3 bg-mono-100/70 dark:bg-mono-900/70 border border-mono-200 dark:border-mono-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-mono-700 dark:text-mono-300">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verifikasi Keamanan (CAPTCHA)</span>
        </div>
        <button
          type="button"
          onClick={generateChallenge}
          title="Acak Soal CAPTCHA"
          className="p-1 text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition rounded-lg hover:bg-mono-200 dark:hover:bg-mono-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 bg-white dark:bg-mono-950 border border-mono-300 dark:border-mono-700 rounded-lg font-mono font-bold text-sm select-none tracking-widest text-mono-900 dark:text-mono-100 shadow-inner">
          {num1} + {num2} = ?
        </div>

        <input
          type="number"
          value={userAnswer}
          onChange={handleChange}
          disabled={isVerified}
          placeholder="Jawaban"
          className={`flex-1 px-3 py-1.5 bg-white dark:bg-mono-950 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition ${
            isVerified
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
              : error
              ? "border-red-500 focus:ring-red-500"
              : "border-mono-200 dark:border-mono-800 focus:ring-mono-900 dark:focus:ring-mono-100"
          }`}
        />

        {isVerified && (
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in-50" />
            <span className="hidden sm:inline">Terverifikasi</span>
          </div>
        )}
      </div>

      {error && !isVerified && (
        <p className="text-[10px] font-mono text-red-500">Jawaban CAPTCHA salah, silakan coba lagi.</p>
      )}
    </div>
  );
}
