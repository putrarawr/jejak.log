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
  const username = rawUsername ? rawUsername.toLowerCase().trim() : "";

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
        // Query user info
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single();

        if (userData) {
          setProfileUser({
            id: userData.id,
            displayName: userData.display_name || userData.username,
            username: userData.username,
            bio: userData.bio,
          });

          // Fetch user's public places
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
          }
        } else {
          // Fallback to guest user check if username is explorer / demo
          setProfileUser({
            id: "public-explorer",
            displayName: username,
            username: username,
            bio: "Penjelajah Jejak.log — Arsip tempat dan peta eksplorasi personal.",
          });
        }
      } catch (e) {
        setProfileUser({
          id: "public-explorer",
          displayName: username,
          username: username,
          bio: "Penjelajah Jejak.log",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicProfile();
  }, [username]);

  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("📋 Link profil berhasil disalin!");
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
    <div className="min-h-screen bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-mono-900/90 backdrop-blur-md border-b border-mono-200 dark:border-mono-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold text-sm tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span>Jejak.log</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="px-3 py-1.5 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 font-mono text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Profil</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* User Public Hero Card */}
        <div className="bg-white dark:bg-mono-900 p-6 sm:p-8 rounded-3xl border border-mono-200 dark:border-mono-800 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-mono text-3xl font-bold shadow-2xl shrink-0">
            {profileUser?.displayName ? profileUser.displayName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{profileUser?.displayName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-1">
                <Globe className="w-3 h-3" /> Profil Publik
              </span>
            </div>

            <p className="font-mono text-xs text-mono-400">@{profileUser?.username}</p>

            <p className="text-xs sm:text-sm text-mono-700 dark:text-mono-300 max-w-2xl leading-relaxed pt-1">
              {profileUser?.bio || "Arsip personal eksplorasi dan kenangan perjalanan."}
            </p>
          </div>

          <div className="px-4 py-3 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-2xl text-center shrink-0">
            <span className="font-mono text-3xl font-bold block">{places.length}</span>
            <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
              Singgahan Publik
            </span>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg tracking-tight">Peta & Galeri Eksplorasi</h2>

          <div className="flex items-center gap-1 bg-white dark:bg-mono-900 p-1 rounded-xl border border-mono-200 dark:border-mono-800 shadow-sm">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                activeTab === "map"
                  ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-bold"
                  : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                activeTab === "grid"
                  ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-bold"
                  : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Album Grid</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {places.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-3xl p-8">
            <MapPin className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700 mb-2" />
            <p className="text-sm font-medium text-mono-600 dark:text-mono-400">
              Belum ada singgahan publik dari @{username}
            </p>
            <p className="text-xs text-mono-400 mt-1">
              Singgahan publik yang dibagikan pengguna ini akan tampil di sini.
            </p>
          </div>
        ) : activeTab === "map" ? (
          <div className="w-full h-[520px]">
            <InteractiveMap places={places} />
          </div>
        ) : (
          <AlbumGrid places={places} onSelectPlace={() => {}} />
        )}
      </main>
    </div>
  );
}
