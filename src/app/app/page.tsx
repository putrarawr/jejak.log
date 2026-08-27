"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import dynamic from "next/dynamic";
import AlbumGrid from "@/components/album/AlbumGrid";
import AddEntryModal from "@/components/entry/AddEntryModal";
import StatsWidget from "@/components/dashboard/StatsWidget";
import TimelineView from "@/components/timeline/TimelineView";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

function DashboardContent() {
  const { user, isGuestMode } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"map" | "grid" | "timeline">("map");
  const [places, setPlaces] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isVerified = searchParams.get("verified");
    if (isVerified === "true") {
      toast.success("Selamat! Email Anda berhasil terverifikasi. Akun Anda telah aktif!");
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchPlaces() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (isGuestMode) {
        const savedGuestPlaces = localStorage.getItem("jejaklog_places_guest");
        if (savedGuestPlaces) {
          try {
            setPlaces(JSON.parse(savedGuestPlaces));
          } catch (e) {
            setPlaces([]);
          }
        } else {
          setPlaces([]);
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Database fetch error, checking local user storage:", error);
          const savedUserPlaces = localStorage.getItem(`jejaklog_places_${user.id}`);
          setPlaces(savedUserPlaces ? JSON.parse(savedUserPlaces) : []);
        } else if (data) {
          const mapped = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            latitude: row.latitude,
            longitude: row.longitude,
            notes: row.notes,
            visitedAt: row.visited_at,
            isPublic: row.is_public,
            media: row.media_json || [],
          }));
          setPlaces(mapped);
          localStorage.setItem(`jejaklog_places_${user.id}`, JSON.stringify(mapped));
        }
      } catch (err) {
        console.error("Fetch places error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaces();
  }, [user, isGuestMode]);

  const handleAddPlace = async (newPlace: any) => {
    // Generate a temporary ID for optimistic UI
    const tempId = "temp-" + Date.now();
    const optimisticPlace = {
      ...newPlace,
      id: tempId,
      visitedAt: newPlace.visited_at,
      isPublic: newPlace.is_public,
      media: newPlace.media_json || [], // Map media_json to media for AlbumGrid
    };

    setPlaces((prev) => [optimisticPlace, ...prev]);

    if (user) {
      if (isGuestMode) {
        const saved = JSON.parse(localStorage.getItem("jejaklog_places_guest") || "[]");
        localStorage.setItem("jejaklog_places_guest", JSON.stringify([optimisticPlace, ...saved]));
      } else {
        try {
          // Insert to Supabase DB
          const dbPayload = {
            user_id: user.id,
            name: newPlace.name,
            type: newPlace.type,
            latitude: newPlace.latitude,
            longitude: newPlace.longitude,
            notes: newPlace.notes,
            visited_at: newPlace.visited_at,
            is_public: newPlace.is_public,
            media_json: newPlace.media_json,
          };

          const { data, error } = await supabase.from("places").insert(dbPayload).select().single();

          if (error) {
            console.error("Gagal menyimpan ke database:", error);
            // Revert optimistic UI on error
            setPlaces((prev) => prev.filter((p) => p.id !== tempId));
            return;
          }

          // Replace temp id with real DB data
          if (data) {
            const mappedData = {
              id: data.id,
              name: data.name,
              type: data.type,
              latitude: data.latitude,
              longitude: data.longitude,
              notes: data.notes,
              visitedAt: data.visited_at,
              isPublic: data.is_public,
              media: data.media_json || [],
            };

            setPlaces((prev) => prev.map((p) => (p.id === tempId ? mappedData : p)));
            
            const saved = JSON.parse(localStorage.getItem(`jejaklog_places_${user.id}`) || "[]");
            const updatedStorage = [mappedData, ...saved.filter((p: any) => p.id !== tempId)];
            localStorage.setItem(`jejaklog_places_${user.id}`, JSON.stringify(updatedStorage));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));

    if (user) {
      if (!isGuestMode) {
        try {
          await supabase.from("places").delete().eq("id", placeId);
        } catch (e) {}
        const saved = JSON.parse(localStorage.getItem(`jejaklog_places_${user.id}`) || "[]");
        const filtered = saved.filter((p: any) => p.id !== placeId);
        localStorage.setItem(`jejaklog_places_${user.id}`, JSON.stringify(filtered));
      } else {
        const saved = JSON.parse(localStorage.getItem("jejaklog_places_guest") || "[]");
        const filtered = saved.filter((p: any) => p.id !== placeId);
        localStorage.setItem("jejaklog_places_guest", JSON.stringify(filtered));
      }
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenAddModal={() => setIsAddModalOpen(true)}
      totalPlacesCount={places.length}
    >
      <div className="flex-1 flex flex-col space-y-6">
        {/* Ringkasan Dashboard Widget */}
        <StatsWidget places={places} />

        {/* Content View Modes */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === "map" && (
            <div className="flex-1 flex flex-col space-y-3 min-h-[500px]">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold">Peta Sebaran Singgahan</h2>
                <p className="text-xs text-mono-500 font-mono hidden sm:block">
                  Klik pin pada peta untuk melihat detail
                </p>
              </div>

              <div className="flex-1 rounded-3xl overflow-hidden border border-mono-200 dark:border-mono-800 relative shadow-sm min-h-[450px]">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-mono-100/50 dark:bg-mono-900/50 backdrop-blur-sm">
                    <span className="font-mono text-xs animate-pulse">Memuat Peta...</span>
                  </div>
                ) : (
                  <InteractiveMap places={places} />
                )}
              </div>
            </div>
          )}

          {activeTab === "grid" && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-bold">Album Singgahan</h2>
                <span className="font-mono text-xs text-mono-500">{places.length} item</span>
              </div>
              <AlbumGrid places={places} onDeletePlace={handleDeletePlace} />
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-bold">Timeline Perjalanan</h2>
                <span className="font-mono text-xs text-mono-500">Urutan Kronologis</span>
              </div>
              <TimelineView places={places} onDeletePlace={handleDeletePlace} />
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Singgahan Baru */}
      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlace={handleAddPlace}
      />
    </AppShell>
  );
}

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs text-mono-400">
          Memuat Dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
