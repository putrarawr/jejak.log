"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import {
  Compass,
  Map as MapIcon,
  Grid,
  PlusCircle,
  LogOut,
  User,
  ShieldAlert,
  Download,
  Upload,
  Home,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  activeTab: "map" | "grid";
  onTabChange: (tab: "map" | "grid") => void;
  onOpenAddModal: () => void;
  totalPlacesCount: number;
}

export default function AppShell({
  children,
  activeTab,
  onTabChange,
  onOpenAddModal,
  totalPlacesCount,
}: AppShellProps) {
  const { user, isGuestMode, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleExportBackup = async () => {
    try {
      let dataToExport = [];
      if (user) {
        const { data } = await supabase.from("places").select("*").eq("user_id", user.id);
        if (data) dataToExport = data;
      } else {
        const key = "jejaklog_places_guest";
        const saved = localStorage.getItem(key) || "[]";
        dataToExport = JSON.parse(saved);
      }
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jejaklog_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowUserMenu(false);
    } catch (err) {
      alert("Gagal mencadangkan data.");
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          if (user) {
            // Import to Supabase Cloud
            const mappedData = parsed.map((p: any) => ({
              id: p.id, // Gunakan ID asli agar tidak dobel jika sudah ada
              user_id: user.id,
              name: p.name,
              type: p.type,
              latitude: p.latitude,
              longitude: p.longitude,
              notes: p.notes,
              // Fallback property name untuk support backup versi lama (localStorage)
              visited_at: p.visited_at || p.visitedAt || new Date().toISOString(),
              is_public: p.is_public !== undefined ? p.is_public : (p.isPublic || false),
              media_json: p.media_json || p.media || []
            }));

            // Upsert (Insert/Update)
            const { error } = await supabase.from("places").upsert(mappedData);
            if (error) {
              console.error(error);
              alert("Gagal memulihkan ke Cloud: " + error.message);
              return;
            }
          } else {
            // Guest mode fallback
            const key = "jejaklog_places_guest";
            localStorage.setItem(key, JSON.stringify(parsed));
          }
          
          alert("Cadangan data berhasil dipulihkan! Halaman akan memuat ulang.");
          window.location.reload();
        } else {
          alert("Format berkas cadangan JSON tidak valid.");
        }
      } catch (err) {
        alert("Gagal membaca berkas cadangan JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 pb-20 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-mono-900/80 backdrop-blur-md border-b border-mono-200 dark:border-mono-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Total Count Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-mono font-bold text-base tracking-tight">
              <div className="w-7 h-7 rounded-lg bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Jejak.log</span>
            </Link>
            <div className="px-2.5 py-0.5 rounded-full bg-mono-200/60 dark:bg-mono-800/60 font-mono text-xs text-mono-600 dark:text-mono-400">
              {totalPlacesCount} singgahan
            </div>
            {isGuestMode && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono">
                <ShieldAlert className="w-3 h-3" /> Mode Demo
              </span>
            )}
          </div>

          {/* Center Tabs for Desktop */}
          <div className="hidden md:flex items-center gap-1 bg-mono-100 dark:bg-mono-800/60 p-1 rounded-xl border border-mono-200 dark:border-mono-700">
            <button
              onClick={() => onTabChange("map")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "map"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow-sm"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Peta Eksplorasi
            </button>
            <button
              onClick={() => onTabChange("grid")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "grid"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow-sm"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Grid Album
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 text-xs font-medium rounded-xl transition shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Tambah Tempat
            </button>

            <Link
              href="/"
              title="Kembali ke Beranda"
              className="hidden sm:flex p-1.5 text-mono-500 hover:text-mono-900 dark:text-mono-400 dark:hover:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-lg transition"
            >
              <Home className="w-5 h-5" />
            </Link>

            <ThemeToggle />

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-mono-200 dark:bg-mono-800 border border-mono-300 dark:border-mono-700 flex items-center justify-center font-mono text-xs font-semibold overflow-hidden hover:opacity-80 transition"
              >
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-mono-100 dark:border-mono-800">
                    <p className="font-medium text-xs truncate">{user?.displayName || "Petualang"}</p>
                    <p className="font-mono text-[10px] text-mono-400 truncate">@{user?.username}</p>
                  </div>

                  {isGuestMode && (
                    <div className="px-4 py-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 border-b border-mono-100 dark:border-mono-800">
                      Anda berada dalam Mode Demo. Data disimpan di perangkat lokal.
                    </div>
                  )}

                  {/* Backup & Restore Action Items */}
                  <div className="py-1 border-b border-mono-100 dark:border-mono-800">
                    <button
                      onClick={handleExportBackup}
                      className="w-full text-left px-4 py-2 text-xs text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-mono-500" />
                      <span>Cadangkan Data (.json)</span>
                    </button>

                    <label className="cursor-pointer w-full text-left px-4 py-2 text-xs text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition">
                      <Upload className="w-3.5 h-3.5 text-mono-500" />
                      <span>Pulihkan Data (.json)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar Akun
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">{children}</main>

      {/* Mobile Bottom Navigation Bar (Floating Mobile-First UI) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-mono-900/90 backdrop-blur-lg border-t border-mono-200 dark:border-mono-800 px-6 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onTabChange("map")}
          className={`flex flex-col items-center gap-1 p-1 transition ${
            activeTab === "map"
              ? "text-mono-900 dark:text-mono-100 font-semibold"
              : "text-mono-400 hover:text-mono-700 dark:hover:text-mono-300"
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono">Peta</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="w-12 h-12 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center shadow-lg -mt-4 active:scale-95 transition"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => onTabChange("grid")}
          className={`flex flex-col items-center gap-1 p-1 transition ${
            activeTab === "grid"
              ? "text-mono-900 dark:text-mono-100 font-semibold"
              : "text-mono-400 hover:text-mono-700 dark:hover:text-mono-300"
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-mono">Album</span>
        </button>
      </nav>
    </div>
  );
}
