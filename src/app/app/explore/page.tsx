"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import AlbumGrid from "@/components/album/AlbumGrid";
import SocialActions from "@/components/social/SocialActions";
import { createClient } from "@/lib/supabase/client";
import { Compass, Globe, Search, User, MapPin } from "lucide-react";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

export default function ExploreCommunityPage() {
  const router = useRouter();
  const supabase = createClient();

  const [publicPlaces, setPublicPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"map" | "grid" | "timeline">("grid");
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
            media: row.media_json,
          }));
          setPublicPlaces(mapped);
        } else {
          // Fallback sample public places
          setPublicPlaces([
            {
              id: "sample-1",
              name: "Kopi Titik Temu",
              type: "kuliner",
              latitude: -6.2297,
              longitude: 106.8074,
              notes: "Spot kopi yang estetik dengan arsitektur monokrom yang tenang di Jakarta.",
              visitedAt: "2026-08-20T10:00:00.000Z",
              isPublic: true,
              media: [
                {
                  id: "m-1",
                  storageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
                  type: "photo",
                },
              ],
            },
            {
              id: "sample-2",
              name: "Bukit Sikunir Dieng",
              type: "alam",
              latitude: -7.2185,
              longitude: 109.9113,
              notes: "Negeri di atas awan. Momen golden sunrise yang tidak terlupakan.",
              visitedAt: "2026-08-15T05:30:00.000Z",
              isPublic: true,
              media: [
                {
                  id: "m-2",
                  storageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
                  type: "photo",
                },
              ],
            },
          ]);
        }
      } catch (e) {
        setPublicPlaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicCommunityPlaces();
  }, []);

  const filteredPlaces = publicPlaces.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenAddModal={() => router.push("/app")}
      totalPlacesCount={publicPlaces.length}
    >
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="bg-white dark:bg-mono-900 p-6 sm:p-8 rounded-3xl border border-mono-200 dark:border-mono-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Jelajah Komunitas Penjelajah</h1>
            </div>
            <p className="text-xs text-mono-500 dark:text-mono-400 max-w-xl">
              Temukan tempat-tempat menarik dan inspirasi eksplorasi publik yang dibagikan oleh para petualang Jejak.log.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mono-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari singgahan publik..."
              className="w-full pl-10 pr-4 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
            />
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === "map" ? (
          <div className="w-full h-[520px]">
            <InteractiveMap places={filteredPlaces} />
          </div>
        ) : (
          <div className="space-y-6">
            <AlbumGrid places={filteredPlaces} onSelectPlace={() => {}} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
