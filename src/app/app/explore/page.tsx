"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import AlbumGrid from "@/components/album/AlbumGrid";
import SocialActions from "@/components/social/SocialActions";
import { createClient } from "@/lib/supabase/client";
import {
  Compass,
  Globe,
  Search,
  User,
  MapPin,
  Grid,
  Map as MapIcon,
  Film,
  ArrowRight,
  Calendar,
} from "lucide-react";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] flex items-center justify-center bg-mono-100 dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl animate-pulse font-mono text-xs text-mono-400">
      <Compass className="w-6 h-6 animate-spin mr-2" />
      Memuat Peta Eksplorasi...
    </div>
  ),
});

export default function ExploreCommunityPage() {
  const router = useRouter();
  const supabase = createClient();

  const [publicPlaces, setPublicPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "reels">("grid");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPublicCommunityPlaces() {
      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const mapped = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            latitude: row.latitude,
            longitude: row.longitude,
            notes: row.notes,
            visitedAt: row.visited_at,
            isPublic: row.is_public,
            username: row.username || "explorer",
            displayName: row.display_name || "Petualang",
            media: row.media_json,
          }));
          setPublicPlaces(mapped);
        } else {
          setPublicPlaces([]);
        }
      } catch (e) {
        setPublicPlaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicCommunityPlaces();
  }, []);

  const cleanQuery = search.toLowerCase().trim();
  const filteredPlaces = publicPlaces.filter(
    (p) =>
      p.name.toLowerCase().includes(cleanQuery) ||
      p.type.toLowerCase().includes(cleanQuery) ||
      (p.notes && p.notes.toLowerCase().includes(cleanQuery)) ||
      (p.username && p.username.toLowerCase().includes(cleanQuery)) ||
      (p.displayName && p.displayName.toLowerCase().includes(cleanQuery))
  );

  return (
    <AppShell
      activeTab="timeline"
      onTabChange={() => {}}
      onOpenAddModal={() => router.push("/app")}
      totalPlacesCount={publicPlaces.length}
    >
      <div className="space-y-6 pb-12">
        {/* Header Hero & Search Bar */}
        <div className="bg-white dark:bg-mono-900 p-6 sm:p-8 rounded-3xl border border-mono-200 dark:border-mono-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Jelajah Komunitas Penjelajah</h1>
            </div>
            <p className="text-xs text-mono-500 dark:text-mono-400 max-w-xl">
              Cari username petualang, tempat, atau nikmati alur reels visual eksplorasi publik.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mono-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username, nama tempat, kategori..."
              className="w-full pl-10 pr-4 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
            />
          </div>
        </div>

        {/* View Switcher Controls (Grid | Peta | Reels Feed) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mono-400">
              {filteredPlaces.length} Tempat Ditemukan
            </span>
          </div>

          <div className="flex items-center gap-1 bg-mono-200/60 dark:bg-mono-800/60 p-1 rounded-2xl border border-mono-300 dark:border-mono-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid Album</span>
            </button>

            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition ${
                viewMode === "map"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>

            <button
              onClick={() => setViewMode("reels")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition ${
                viewMode === "reels"
                  ? "bg-white dark:bg-mono-900 text-mono-900 dark:text-mono-100 shadow font-bold"
                  : "text-mono-500 dark:text-mono-400 hover:text-mono-900"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Reels Visual</span>
            </button>
          </div>
        </div>

        {/* View Mode Contents */}
        {filteredPlaces.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-3xl p-8 space-y-2">
            <Globe className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700" />
            <p className="text-sm font-medium text-mono-600 dark:text-mono-400">
              Belum ada singgahan publik dari komunitas
            </p>
            <p className="text-xs text-mono-400 max-w-sm mx-auto">
              Jadilah yang pertama membagikan tempat eksplorasi publik Anda dengan menandai opsi Publik saat menambahkan tempat.
            </p>
          </div>
        ) : viewMode === "map" ? (
          <div className="w-full h-[520px] rounded-3xl overflow-hidden border border-mono-200 dark:border-mono-800 shadow-xl bg-mono-900">
            <InteractiveMap places={filteredPlaces} />
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-6">
            <AlbumGrid places={filteredPlaces} onSelectPlace={() => {}} />
          </div>
        ) : (
          /* Reels / Vertical Feed View Mode */
          <div className="max-w-xl mx-auto space-y-8">
            {filteredPlaces.map((place) => {
              const firstMedia = place.media && place.media.length > 0 ? place.media[0] : null;

              return (
                <div
                  key={place.id}
                  className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5"
                >
                  {/* User Profile Header Badge */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/profile/${place.username || "explorer"}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold text-sm shadow">
                        {place.displayName ? place.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-mono-900 dark:text-mono-100 group-hover:text-blue-500 transition-colors">
                          {place.displayName || "Petualang"}
                        </h4>
                        <p className="font-mono text-xs text-mono-400">@{place.username || "explorer"}</p>
                      </div>
                    </Link>

                    <Link
                      href={`/profile/${place.username || "explorer"}`}
                      className="px-3 py-1 bg-mono-100 dark:bg-mono-800 text-mono-700 dark:text-mono-300 font-mono text-[11px] font-bold rounded-xl hover:bg-mono-200 transition"
                    >
                      Lihat Profil
                    </Link>
                  </div>

                  {/* Reels Media Card */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-mono-950 border border-mono-200 dark:border-mono-800">
                    {firstMedia ? (
                      firstMedia.type === "photo" ? (
                        <img
                          src={firstMedia.storageUrl}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video src={firstMedia.storageUrl} controls className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-mono-400 font-mono text-xs">
                        Tidak ada preview media
                      </div>
                    )}

                    {/* Overlay Details */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mono-950/90 via-mono-950/40 to-transparent p-4 text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-mono-900/80 font-mono text-[10px] uppercase font-bold text-white border border-white/20">
                          {place.type}
                        </span>
                        <span className="font-mono text-[11px] text-mono-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(place.visitedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="font-bold text-base tracking-tight">{place.name}</h3>
                      <p className="text-xs text-mono-300 line-clamp-2 leading-relaxed">
                        {place.notes || "Catatan eksplorasi."}
                      </p>
                    </div>
                  </div>

                  {/* Social Actions (Likes & Comments) */}
                  <SocialActions placeId={place.id} isPublic={true} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
