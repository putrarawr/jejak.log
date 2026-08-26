"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import dynamic from "next/dynamic";
import AlbumGrid from "@/components/album/AlbumGrid";
import AddEntryModal from "@/components/entry/AddEntryModal";
import EntryDetailModal from "@/components/album/EntryDetailModal";
import { useAuth } from "@/context/AuthContext";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

const INITIAL_SAMPLE_PLACES = [
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
  {
    id: "sample-3",
    name: "Candi Borobudur",
    type: "sejarah",
    latitude: -7.6079,
    longitude: 110.2038,
    notes: "Warisan budaya yang megah. Pagi hari yang tenang dan berkabut.",
    visitedAt: "2026-08-10T07:00:00.000Z",
    isPublic: false,
    media: [
      {
        id: "m-3",
        storageUrl: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80",
        type: "photo",
      },
    ],
  },
];

import { createClient } from "@/lib/supabase/client";

export default function AppPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"map" | "grid">("map");
  const [places, setPlaces] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaces() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          console.warn("Using sample fallback places:", error);
          setPlaces(INITIAL_SAMPLE_PLACES);
        } else {
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
          setPlaces(mapped);
        }
      } catch (err) {
        console.warn("Network issue fetching places, using fallback:", err);
        setPlaces(INITIAL_SAMPLE_PLACES);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaces();
  }, [user]);

  const handleAddPlace = async (newPlace: any) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("places")
      .insert([
        {
          user_id: user.id,
          ...newPlace
        }
      ])
      .select();

    if (error) {
      alert("Gagal menyimpan ke database: " + error.message);
    } else if (data && data.length > 0) {
      const inserted = data[0];
      const mappedPlace = {
        id: inserted.id,
        name: inserted.name,
        type: inserted.type,
        latitude: inserted.latitude,
        longitude: inserted.longitude,
        notes: inserted.notes,
        visitedAt: inserted.visited_at,
        isPublic: inserted.is_public,
        media: inserted.media_json,
      };
      setPlaces([mappedPlace, ...places]);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    // Optimistic UI update
    setPlaces(places.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenAddModal={() => setIsAddModalOpen(true)}
      totalPlacesCount={places.length}
    >
      {activeTab === "map" ? (
        <div className="w-full flex-1 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg tracking-tight">Peta Sebaran Singgahan</h2>
            <span className="font-mono text-xs text-mono-400">
              Klik pin pada peta untuk melihat preview detail
            </span>
          </div>
          <div className="flex-1 w-full min-h-[480px]">
            <InteractiveMap places={places} />
          </div>
        </div>
      ) : (
        <div className="w-full flex-1">
          <div className="mb-4">
            <h2 className="font-bold text-lg tracking-tight">Arsip Galeri & Grid Album</h2>
            <p className="text-xs text-mono-500 dark:text-mono-400">
              Semua tempat yang pernah Anda kunjungi tersusun rapi dalam bentuk grid.
            </p>
          </div>
          <AlbumGrid places={places} onSelectPlace={() => {}} />
        </div>
      )}

      {/* Add Place Modal */}
      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlace={handleAddPlace}
      />


    </AppShell>
  );
}
