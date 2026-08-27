"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { exportToGPX, exportToKML } from "@/lib/utils/exportGeo";
import { toast } from "sonner";
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
  activeTab: "map" | "grid" | "timeline";
  onTabChange: (tab: "map" | "grid" | "timeline") => void;
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
      toast.success("📁 Data berhasil dicadangkan!");
    } catch (err) {
      toast.error("Gagal mencadangkan data.");
    }
  };

  const handleExportGPX = async () => {
    try {
      let dataToExport: any[] = [];
      if (user) {
        const { data } = await supabase.from("places").select("*").eq("user_id", user.id);
        if (data) dataToExport = data;
      } else {
        const saved = localStorage.getItem("jejaklog_places_guest") || "[]";
        dataToExport = JSON.parse(saved);
      }
      
      const mapped = dataToExport.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        latitude: p.latitude,
        longitude: p.longitude,
        notes: p.notes,
        visitedAt: p.visited_at || p.visitedAt || new Date().toISOString(),
      }));

      const gpxXml = exportToGPX(mapped);
      const blob = new Blob([gpxXml], { type: "application/gpx+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jejaklog_export_${new Date().toISOString().split("T")[0]}.gpx`;
      a.click();
      URL.revokeObjectURL(url);
      setShowUserMenu(false);
      toast.success("🗺️ Berkas GPX berhasil diekspor!");
    } catch (err) {
      toast.error("Gagal mengeskpor format GPX.");
    }
  };

  const handleExportKML = async () => {
    try {
      let dataToExport: any[] = [];
      if (user) {
        const { data } = await supabase.from("places").select("*").eq("user_id", user.id);
        if (data) dataToExport = data;
      } else {
        const saved = localStorage.getItem("jejaklog_places_guest") || "[]";
        dataToExport = JSON.parse(saved);
      }

      const mapped = dataToExport.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        latitude: p.latitude,
        longitude: p.longitude,
        notes: p.notes,
        visitedAt: p.visited_at || p.visitedAt || new Date().toISOString(),
      }));

      const kmlXml = exportToKML(mapped);
      const blob = new Blob([kmlXml], { type: "application/vnd.google-earth.kml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jejaklog_export_${new Date().toISOString().split("T")[0]}.kml`;
      a.click();
      URL.revokeObjectURL(url);
      setShowUserMenu(false);
      toast.success("🌍 Berkas Google Earth KML berhasil diekspor!");
    } catch (err) {
      toast.error("Gagal mengeskpor KML.");
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
            const mappedData = parsed.map((p: any) => ({
              id: p.id,
              user_id: user.id,
              name: p.name,
              type: p.type,
              latitude: p.latitude,
              longitude: p.longitude,
              notes: p.notes,
              visited_at: p.visited_at || p.visitedAt || new Date().toISOString(),
              is_public: p.is_public !== undefined ? p.is_public : (p.isPublic || false),
              media_json: p.media_json || p.media || []
            }));

            const { error } = await supabase.from("places").upsert(mappedData);
            if (error) {
              toast.error("Gagal memulihkan ke Cloud: " + error.message);
              return;
            }
          } else {
            const key = "jejaklog_places_guest";
            localStorage.setItem(key, JSON.stringify(parsed));
          }
          
          toast.success("Cadangan data berhasil dipulihkan!");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error("Format berkas cadangan JSON tidak valid.");
        }
      } catch (err) {
        toast.error("Gagal membaca berkas cadangan JSON.");
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
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow-sm font-bold"
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
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow-sm font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Grid Album
            </button>
            <button
              onClick={() => onTabChange("timeline")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "timeline"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow-sm font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Timeline Kronologis
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <Link
              href="/app/explore"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-xl transition"
            >
              <Compass className="w-3.5 h-3.5" />
              Jelajah Komunitas
            </Link>

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
                    <p className="font-medium text-xs truncate">{user?.displayName || user?.username || "Petualang"}</p>
                    <p className="font-mono text-[11px] text-mono-500 dark:text-mono-400 truncate">@{user?.username || "explorer"}</p>
                    {user?.email && (
                      <p className="font-mono text-[10px] text-mono-400 dark:text-mono-500 truncate mt-0.5 flex items-center gap-1">
                        <span>{user.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="py-1 border-b border-mono-100 dark:border-mono-800">
                    <Link
                      href="/app/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 text-xs text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition"
                    >
                      <User className="w-3.5 h-3.5 text-mono-500" />
                      <span>Pengaturan Profil Akun</span>
                    </Link>
                  </div>

                  {/* Backup & Restore Action Items */}
                  <div className="py-1 border-b border-mono-100 dark:border-mono-800">
                    <button
                      onClick={handleExportBackup}
                      className="w-full text-left px-4 py-2 text-xs text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-mono-500" />
                      <span>Cadangkan Data (.json)</span>
                    </button>

                    <button
                      onClick={handleExportGPX}
                      className="w-full text-left px-4 py-2 text-xs text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ekspor Format GPX (.gpx)</span>
                    </button>

                    <button
                      onClick={handleExportKML}
                      className="w-full text-left px-4 py-2 text-xs text-mono-700 dark:text-mono-300 hover:bg-mono-100 dark:hover:bg-mono-800/50 flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ekspor Google Earth (.kml)</span>
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

      {/* Floating Centered Action Button (+ Tambah Singgahan) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onOpenAddModal}
          className="px-5 py-3 rounded-full bg-mono-900 text-mono-100 dark:bg-mono-100 dark:text-mono-900 font-mono text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 border border-mono-700 dark:border-mono-300 backdrop-blur-md"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>Tambah Singgahan</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-mono-900/90 backdrop-blur-lg border-t border-mono-200 dark:border-mono-800 px-6 py-2 flex items-center justify-between shadow-2xl">
        <button
          onClick={() => onTabChange("map")}
          className={`flex flex-col items-center gap-0.5 p-1 transition ${
            activeTab === "map"
              ? "text-mono-900 dark:text-mono-100 font-semibold"
              : "text-mono-400 hover:text-mono-700 dark:hover:text-mono-300"
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span className="text-[9px] font-mono">Peta</span>
        </button>

        <button
          onClick={() => onTabChange("grid")}
          className={`flex flex-col items-center gap-0.5 p-1 transition ${
            activeTab === "grid"
              ? "text-mono-900 dark:text-mono-100 font-semibold"
              : "text-mono-400 hover:text-mono-700 dark:hover:text-mono-300"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span className="text-[9px] font-mono">Grid</span>
        </button>

        <div className="w-24" /> {/* Spacer for Floating Center Button */}

        <button
          onClick={() => onTabChange("timeline")}
          className={`flex flex-col items-center gap-0.5 p-1 transition ${
            activeTab === "timeline"
              ? "text-mono-900 dark:text-mono-100 font-semibold"
              : "text-mono-400 hover:text-mono-700 dark:hover:text-mono-300"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[9px] font-mono">Timeline</span>
        </button>
      </nav>
    </div>
  );
}
