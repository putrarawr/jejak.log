"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import {
  Globe,
  Search,
  User,
  Image as ImageIcon,
  ArrowRight,
  Compass,
} from "lucide-react";

export default function ExploreCommunityPage() {
  const router = useRouter();
  const supabase = createClient();

  const [publicPlaces, setPublicPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
            user_id: row.user_id,
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

  // Group places by user
  const groupedUsers = React.useMemo(() => {
    const map = new Map<string, any>();
    publicPlaces.forEach((p) => {
      const uId = p.user_id || p.username; // fallback to username if no user_id
      if (!map.has(uId)) {
        map.set(uId, {
          userId: p.user_id,
          username: p.username,
          displayName: p.displayName,
          places: [],
        });
      }
      map.get(uId).places.push(p);
    });
    return Array.from(map.values());
  }, [publicPlaces]);

  const filteredUsers = groupedUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(cleanQuery) ||
      u.displayName.toLowerCase().includes(cleanQuery) ||
      u.places.some((p: any) => p.name.toLowerCase().includes(cleanQuery))
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
              Cari username petualang dan lihat cuplikan eksplorasi publik mereka.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mono-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari username atau tempat..."
              className="w-full pl-10 pr-4 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
            />
          </div>
        </div>

        {/* View Mode Contents */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-mono-400">
            <Compass className="w-8 h-8 animate-spin" />
            <p className="font-mono text-xs">Memuat komunitas...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-3xl p-8 space-y-2">
            <Globe className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700" />
            <p className="text-sm font-medium text-mono-600 dark:text-mono-400">
              Belum ada pengguna dengan singgahan publik.
            </p>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl mx-auto">
            {filteredUsers.map((userGroup, idx) => (
              <div
                key={userGroup.userId || userGroup.username || idx}
                className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-6 shadow-lg space-y-5 transition hover:shadow-xl"
              >
                {/* User Header */}
                <div className="flex items-center justify-between border-b border-mono-100 dark:border-mono-800 pb-4">
                  <Link
                    href={`/profile/${userGroup.username}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold text-base shadow shrink-0 group-hover:scale-105 transition-transform">
                      {userGroup.displayName ? userGroup.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-mono-900 dark:text-mono-100 group-hover:text-blue-500 transition-colors">
                        {userGroup.displayName || "Petualang"}
                      </h4>
                      <p className="font-mono text-xs text-mono-400">@{userGroup.username}</p>
                    </div>
                  </Link>
                  <Link
                    href={`/profile/${userGroup.username}`}
                    className="px-4 py-2 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-800 dark:text-mono-200 font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition shrink-0 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Lihat Profil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Spoiler Album Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userGroup.places.slice(0, 4).map((place: any) => {
                    const firstMedia = place.media && place.media.length > 0 ? place.media[0] : null;

                    return (
                      <Link
                        key={place.id}
                        href={`/app/album/${place.id}`}
                        className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-mono-100 dark:bg-mono-800 block border border-mono-200 dark:border-mono-700"
                      >
                        {firstMedia ? (
                          firstMedia.type === "photo" ? (
                            <img
                              src={firstMedia.storageUrl}
                              alt={place.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <video
                              src={firstMedia.storageUrl}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-mono-400 group-hover:bg-mono-200 dark:group-hover:bg-mono-700 transition-colors duration-300">
                            <ImageIcon className="w-6 h-6 mb-2" />
                            <span className="font-mono text-[10px]">Tanpa Foto</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex flex-col justify-end min-h-[50%]">
                          <h5 className="text-white font-bold text-xs sm:text-sm line-clamp-2 leading-tight">
                            {place.name}
                          </h5>
                          <p className="text-mono-300 font-mono text-[9px] sm:text-[10px] mt-1 line-clamp-1">
                            {place.type}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
