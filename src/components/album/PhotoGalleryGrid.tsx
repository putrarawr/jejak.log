"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Image as ImageIcon, Video, Calendar, Sparkles } from "lucide-react";

interface PlaceItem {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  notes?: string;
  visitedAt: string;
  isPublic: boolean;
  media?: { id?: string; storageUrl: string; type: string }[];
}

interface FlattenedMedia {
  id: string;
  storageUrl: string;
  type: string;
  place: PlaceItem;
  visitedAt: string;
}

interface PhotoGalleryGridProps {
  places: PlaceItem[];
  onSelectPlace: (place: PlaceItem) => void;
}

export default function PhotoGalleryGrid({ places, onSelectPlace }: PhotoGalleryGridProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "photo" | "video">("all");

  // Extract unique place types
  const placeTypes = ["all", ...Array.from(new Set(places.map((p) => p.type)))];

  // Flatten all media across all places
  const allMedia: FlattenedMedia[] = useMemo(() => {
    const items: FlattenedMedia[] = [];
    places.forEach((place) => {
      if (place.media && place.media.length > 0) {
        place.media.forEach((m, idx) => {
          items.push({
            id: m.id || `${place.id}-media-${idx}`,
            storageUrl: m.storageUrl,
            type: m.type || "photo",
            place,
            visitedAt: place.visitedAt,
          });
        });
      }
    });
    return items;
  }, [places]);

  // Filter logic
  const filteredMedia = useMemo(() => {
    return allMedia.filter((item) => {
      const matchSearch =
        item.place.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.place.notes && item.place.notes.toLowerCase().includes(search.toLowerCase()));
      const matchPlaceType = selectedType === "all" || item.place.type === selectedType;
      const matchMediaType = mediaFilter === "all" || item.type === mediaFilter;

      return matchSearch && matchPlaceType && matchMediaType;
    });
  }, [allMedia, search, selectedType, mediaFilter]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari foto berdasarkan tempat atau catatan..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 shadow-sm"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Media Type Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 p-1 rounded-xl shadow-sm shrink-0">
            <button
              onClick={() => setMediaFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                mediaFilter === "all"
                  ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-semibold"
                  : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              Semua Media
            </button>
            <button
              onClick={() => setMediaFilter("photo")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                mediaFilter === "photo"
                  ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-semibold"
                  : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              Foto
            </button>
            <button
              onClick={() => setMediaFilter("video")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                mediaFilter === "video"
                  ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-semibold"
                  : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
              }`}
            >
              Video
            </button>
          </div>

          {/* Place Category Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 p-1 rounded-xl shadow-sm overflow-x-auto">
            {placeTypes.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition ${
                  selectedType === t
                    ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-semibold"
                    : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Count Meta info */}
      <div className="flex items-center justify-between font-mono text-xs text-mono-500 dark:text-mono-400 px-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-mono-400" />
          Menampilkan {filteredMedia.length} foto & video
        </span>
        <span>{places.length} singgahan terindeks</span>
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-2xl p-8">
          <ImageIcon className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700 mb-2" />
          <p className="text-sm font-medium text-mono-600 dark:text-mono-400">
            Tidak ada foto/video yang cocok
          </p>
          <p className="text-xs text-mono-400 mt-1">
            Coba ubah kata kunci pencarian atau filter kategori di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredMedia.map((item) => (
            <Link
              key={item.id}
              href={`/app/album/${item.place.id}`}
              onClick={() => onSelectPlace(item.place)}
              className="group relative aspect-square bg-mono-100 dark:bg-mono-800 rounded-xl overflow-hidden cursor-pointer border border-mono-200/60 dark:border-mono-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              {item.type === "photo" ? (
                <img
                  src={item.storageUrl}
                  alt={item.place.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full relative bg-mono-900 flex items-center justify-center">
                  <video
                    src={item.storageUrl}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-mono-950/30">
                    <Video className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                </div>
              )}

              {/* Hover Details Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-mono-950/90 via-mono-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between">
                <div className="flex justify-end">
                  <span className="px-2 py-0.5 rounded-full bg-mono-900/80 backdrop-blur-md text-white font-mono text-[9px] uppercase tracking-wider">
                    {item.place.type}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-white truncate drop-shadow">
                    {item.place.name}
                  </h4>
                  <p className="font-mono text-[10px] text-mono-300 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.visitedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
