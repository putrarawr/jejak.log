"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/theme-toggle";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User,
  AtSign,
  FileText,
  Copy,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Camera,
  Globe,
  Save,
  ArrowLeft,
} from "lucide-react";

export default function UserProfilePage() {
  const { user, isGuestMode, logout } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [totalPublicPlaces, setTotalPublicPlaces] = useState(0);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setUsername(user.username || "");
      
      // Load user profile details from DB or localStorage
      async function loadProfile() {
        if (!user) return;
        if (!isGuestMode) {
          try {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", user.id)
              .single();
            if (data) {
              if (data.display_name) setDisplayName(data.display_name);
              if (data.username) setUsername(data.username);
              if (data.bio) setBio(data.bio);
            }

            const { count } = await supabase
              .from("places")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id);
            if (count !== null) setTotalPlaces(count);

            const { count: pubCount } = await supabase
              .from("places")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("is_public", true);
            if (pubCount !== null) setTotalPublicPlaces(pubCount);
          } catch (err) {
            // Ignore error
          }
        } else {
          const localPlaces = JSON.parse(localStorage.getItem("jejaklog_places_guest") || "[]");
          setTotalPlaces(localPlaces.length);
          setTotalPublicPlaces(localPlaces.filter((p: any) => p.isPublic).length);
        }
      }
      loadProfile();
    }
  }, [user, isGuestMode]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    const cleanUsername = username.toLowerCase().trim();

    try {
      if (!isGuestMode) {
        try {
          await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            username: cleanUsername,
            display_name: displayName,
            bio,
          });
        } catch (supabaseErr) {
          console.warn("Supabase profile save notice:", supabaseErr);
        }
      }

      // Update local session storage
      const updatedUser = {
        ...user,
        displayName,
        username: cleanUsername,
        bio,
      };
      localStorage.setItem("jejaklog_guest_user", JSON.stringify(updatedUser));
      
      toast.success("Profil Anda berhasil diperbarui");
    } catch (err: any) {
      const updatedUser = {
        ...user,
        displayName,
        username: cleanUsername,
        bio,
      };
      localStorage.setItem("jejaklog_guest_user", JSON.stringify(updatedUser));
      toast.success("Profil Anda berhasil diperbarui");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/profile/${username || user?.username}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("📋 Link profil publik disalin ke clipboard!");
  };

  return (
    <AppShell
      activeTab="grid"
      onTabChange={() => router.push("/app")}
      onOpenAddModal={() => router.push("/app")}
      totalPlacesCount={totalPlaces}
    >
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-1.5 font-mono text-xs font-medium text-mono-500 hover:text-mono-900 dark:hover:text-mono-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
          <span className="font-mono text-xs text-mono-400">Pengaturan Akun</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-mono-900 p-6 rounded-3xl border border-mono-200 dark:border-mono-800 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-mono text-3xl font-bold shadow-xl shrink-0">
            {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{displayName || "Petualang Jejak"}</h1>
            <p className="font-mono text-xs text-mono-400">@{username || "explorer"}</p>
            <p className="text-xs text-mono-600 dark:text-mono-300 font-sans leading-relaxed pt-1">
              {bio || "Belum ada bio singkat. Tulis kenangan & impresi eksplorasi Anda."}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleCopyPublicLink}
              className="px-3.5 py-2 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-900 dark:text-mono-100 font-mono text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Link</span>
            </button>
            <Link
              href={`/profile/${username || user?.username}`}
              target="_blank"
              className="px-3.5 py-2 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Publik</span>
            </Link>
          </div>
        </div>

        {/* Stats Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-mono-900 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm text-center">
            <span className="font-mono text-2xl font-bold text-mono-900 dark:text-mono-100 block">
              {totalPlaces}
            </span>
            <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
              Total Singgahan
            </span>
          </div>

          <div className="bg-white dark:bg-mono-900 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm text-center">
            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 block">
              {totalPublicPlaces}
            </span>
            <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" /> Singgahan Publik
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-mono-900 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm text-center">
            <span className="font-mono text-2xl font-bold text-mono-900 dark:text-mono-100 block">
              {user?.email ? user.email.split("@")[1] : "jejaklog.app"}
            </span>
            <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
              Domain Email
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-mono-900 p-6 rounded-3xl border border-mono-200 dark:border-mono-800 shadow-xl space-y-4">
          <h2 className="font-bold text-base tracking-tight border-b border-mono-100 dark:border-mono-800 pb-3">
            Edit Informasi Profil
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                Nama Tampilan
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mono-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama Lengkap / Panggilan"
                  className="w-full pl-10 pr-4 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                Username Unik
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mono-400" />
                <input
                  type="text"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  placeholder="username_unik"
                  className="w-full pl-10 pr-4 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                Alamat Email (Akun)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || "guest@jejaklog.app"}
                className="w-full px-4 py-2.5 bg-mono-100/50 dark:bg-mono-800/40 border border-mono-200 dark:border-mono-800 rounded-xl text-sm text-mono-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
                Bio Personal / Deskripsi Eksplorasi
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan minat tempat & kenangan petualangan favorit Anda..."
                className="w-full px-4 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan Perubahan..." : "Simpan Perubahan Profil"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
