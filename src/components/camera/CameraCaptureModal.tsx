"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, SwitchCamera, ShieldAlert, RefreshCw, Lock } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (dataUrl: string) => void;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapturePhoto,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isCapturingFlash, setIsCapturingFlash] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setErrorMsg("");
    setIsRequestingPermission(true);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Peramban Anda tidak mendukung kamera WebRTC.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1080 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 1 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Izin kamera ditolak atau tidak tersedia:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Akses kamera ditolak oleh peramban HP Anda.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("Perangkat kamera tidak ditemukan di perangkat ini.");
      } else {
        setErrorMsg("Izin kamera tertahan oleh kebijakan keamanan peramban.");
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleTakePicture = () => {
    if (!videoRef.current) return;

    setIsCapturingFlash(true);
    setTimeout(() => setIsCapturingFlash(false), 250);

    const video = videoRef.current;
    const vWidth = video.videoWidth || 800;
    const vHeight = video.videoHeight || 800;

    // Crop to 1:1 Square
    const size = Math.min(vWidth, vHeight);
    const startX = (vWidth - size) / 2;
    const startY = (vHeight - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      onCapturePhoto(dataUrl);
    }
  };

  const handleNativeFallbackCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        onCapturePhoto(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-mono-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Square Modal Container */}
      <div className="relative w-full max-w-sm bg-mono-900 border border-mono-700 rounded-3xl shadow-2xl overflow-hidden p-5 flex flex-col items-center space-y-4">
        {/* Flash Effect */}
        {isCapturingFlash && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />
        )}

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between font-mono text-xs text-mono-300 border-b border-mono-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-mono-100" />
            <span className="font-bold text-mono-100">Kamera 1:1 Album</span>
          </div>

          <div className="flex items-center gap-2">
            {!errorMsg && (
              <button
                onClick={toggleFacingMode}
                className="p-1.5 rounded-lg bg-mono-800 hover:bg-mono-700 text-white transition"
                title="Ganti Kamera Depan/Belakang"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-mono-800 text-mono-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1:1 Square Live Viewfinder Box OR Permission Guide Box */}
        <div className="relative w-full aspect-square bg-mono-950 rounded-2xl overflow-hidden border border-mono-800 flex items-center justify-center shadow-inner p-3">
          {errorMsg ? (
            <div className="text-center p-3 space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-mono-100 mb-1">Izinkan Akses Kamera</h4>
                <p className="text-[11px] text-mono-400 font-mono leading-relaxed">{errorMsg}</p>
              </div>

              <div className="bg-mono-900 p-2.5 rounded-xl border border-mono-800 text-left font-mono text-[10px] text-mono-300 space-y-1">
                <p className="font-bold text-mono-100">Cara Mengaktifkan Izin:</p>
                <p>1. Ketuk ikon gembok atau titik tiga di address bar atas browser HP Anda.</p>
                <p>2. Ubah izin <strong>Kamera</strong> menjadi <strong>Izinkan / Allow</strong>.</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Square Grid Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3">
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
                <div className="border border-white/5" />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col items-center space-y-2.5 pt-1">
          {errorMsg ? (
            <button
              onClick={startCamera}
              disabled={isRequestingPermission}
              className="w-full py-2.5 bg-mono-100 text-mono-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover:bg-mono-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRequestingPermission ? "animate-spin" : ""}`} />
              <span>Coba Lagi Minta Izin Kamera</span>
            </button>
          ) : (
            <button
              onClick={handleTakePicture}
              className="w-16 h-16 rounded-full border-4 border-white bg-mono-100 active:scale-90 transition-transform shadow-2xl flex items-center justify-center p-1"
            >
              <div className="w-full h-full rounded-full bg-white border-2 border-mono-900" />
            </button>
          )}

          <label className="cursor-pointer w-full py-2.5 bg-mono-800 hover:bg-mono-700 text-mono-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-mono-700 shadow text-center">
            <Camera className="w-4 h-4" />
            <span>Atau Jepret via Kamera HP Native</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleNativeFallbackCapture}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
