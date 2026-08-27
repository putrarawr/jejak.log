"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/theme-toggle";
import AlbumGrid from "@/components/album/AlbumGrid";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Compass,
  User,
  MapPin,
  Globe,
  Share2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Grid,
  Map as MapIcon,
} from "lucide-react";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

export default function PublicProfilePage() {
  const params = useParams();
  const rawUsername = params?.username as string;
  const username = rawUsername ? decodeURIComponent(rawUsername).toLowerCase().trim() : "";

  const supabase = createClient();
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"map" | "grid">("map");

  useEffect(() => {
    async function loadPublicProfile() {
      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Query Supabase users table
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .maybeSingle();

        if (userData) {
          setProfileUser({
            id: userData.id,
            displayName: userData.display_name || userData.username,
            username: userData.username,
            bio: userData.bio || "Penjelajah Jejak.log | Arsip tempat dan peta eksplorasi personal.",
          });

          // Fetch user's public places from DB
          const { data: placesData } = await supabase
            .from("places")
            .select("*")
            .eq("user_id", userData.id)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

          if (placesData) {
            const mapped = placesData.map((row: any) => ({
              id: row.id,
              name: row.name,
              type: row.type,
              latitude: row.latitude,
              longitude: row.longitude,
              notes: row.notes,
              visitedAt: row.visited_at,
              isPublic: row.is_public,
              media: row.media_json,
            }));
            setPlaces(mapped);
            setIsLoading(false);
            return;
          }
        }

        // 2. Local Storage Check if viewing own profile
        const savedGuestUser = localStorage.getItem("jejaklog_guest_user");
        let localUser: any = null;
        if (savedGuestUser) {
          try {
            localUser = JSON.parse(savedGuestUser);
          } catch (e) {}
        }

        const isViewingOwnProfile =
          localUser && localUser.username && localUser.username.toLowerCase().trim() === username;

        setProfileUser({
          id: localUser?.id || "public-explorer",
          displayName: localUser?.displayName || username,
          username: username,
          bio: localUser?.bio || "Penjelajah Jejak.log | Arsip tempat dan peta eksplorasi personal.",
        });

        const localGuestPlaces = JSON.parse(localStorage.getItem("jejaklog_places_guest") || "[]");
        const userSpecificPlaces = localUser ? JSON.parse(localStorage.getItem(`jejaklog_places_${localUser.id}`) || "[]") : [];
        const combinedLocal = [...userSpecificPlaces, ...localGuestPlaces];

        const publicLocal = combinedLocal.filter((p: any) => p.isPublic || isViewingOwnProfile);
        setPlaces(publicLocal);
      } catch (e) {
        setProfileUser({
          id: "public-explorer",
          displayName: username,
          username: username,
          bio: "Penjelajah Jejak.log | Arsip tempat dan peta eksplorasi personal.",
        });
        setPlaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicProfile();
  }, [username]);

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link profil berhasil disalin");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mono-50 dark:bg-mono-950 flex items-center justify-center font-mono text-xs text-mono-400">
        Memuat profil eksplorasi...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 flex flex-col pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-mono-900/80 backdrop-blur-md border-b border-mono-200 dark:border-mono-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold text-base tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span>Jejak.log</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShareProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-800 dark:text-mono-200 rounded-xl text-xs font-mono font-semibold transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Profil</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Profile Header Hero */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white dark:bg-mono-900 p-6 sm:p-8 rounded-3xl border border-mono-200 dark:border-mono-800 shadow-xl text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold text-2xl shadow-lg">
            {profileUser?.displayName ? profileUser.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-mono-900 dark:text-mono-100 flex items-center justify-center gap-2">
              <span>{profileUser?.displayName || username}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Profil Publik
              </span>
            </h1>
            <p className="font-mono text-xs text-mono-400">@{profileUser?.username || username}</p>
          </div>

          <p className="text-xs sm:text-sm text-mono-600 dark:text-mono-400 max-w-lg mx-auto leading-relaxed">
            {profileUser?.bio}
          </p>

          <div className="pt-2 flex justify-center">
            <div className="bg-mono-50 dark:bg-mono-950 px-6 py-3 rounded-2xl border border-mono-200 dark:border-mono-800 inline-flex items-center gap-6 font-mono text-xs">
              <div className="text-center">
                <span className="block font-bold text-lg text-mono-900 dark:text-mono-100">
                  {places.length}
                </span>
                <span className="text-[10px] text-mono-400 uppercase">Singgahan Publik</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-bold text-lg tracking-tight">Peta & Galeri Eksplorasi</h2>
          <div className="flex items-center gap-1 bg-mono-200/60 dark:bg-mono-800/60 p-1 rounded-2xl border border-mono-300 dark:border-mono-700">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs transition ${
                activeTab === "map"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Peta
            </button>
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs transition ${
                activeTab === "grid"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Album Grid
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {places.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-3xl p-8 space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700" />
            <p className="text-sm font-medium text-mono-600 dark:text-mono-400">
              Belum ada singgahan publik dari @{username}
            </p>
            <p className="text-xs text-mono-400 max-w-sm mx-auto">
              Singgahan publik yang dibagikan oleh pengguna ini akan muncul secara otomatis di sini.
            </p>
          </div>
        ) : activeTab === "map" ? (
          <div className="w-full h-[480px] rounded-3xl overflow-hidden border border-mono-200 dark:border-mono-800 shadow-lg">
            <InteractiveMap places={places} />
          </div>
        ) : (
          <AlbumGrid places={places} onSelectPlace={() => {}} />
        )}
      </main>
    </div>
  );
}
