"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Filter, Calendar, MapPin, Image as ImageIcon, Video, Star } from "lucide-react";

interface PlaceItem {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  notes?: string;
  visitedAt: string;
  isPublic: boolean;
  isFavorite?: boolean;
  media?: { storageUrl: string; type: string }[];
}

interface AlbumGridProps {
  places: PlaceItem[];
  onSelectPlace?: (place: PlaceItem) => void;
  onToggleFavorite?: (id: string) => void;
  onDeletePlace?: (id: string) => void;
}

export default function AlbumGrid({ places, onSelectPlace, onToggleFavorite }: AlbumGridProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Extract unique place types
  const types = ["all", ...Array.from(new Set(places.map((p) => p.type)))];

  // Filter & Sort logic (Favorites float to top)
  const filteredPlaces = places
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
      const matchType = selectedType === "all" || p.type === selectedType;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      const dateA = new Date(a.visitedAt).getTime();
      const dateB = new Date(b.visitedAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white/40 dark:bg-mono-900/40 p-2 rounded-[1.25rem] border border-mono-200/60 dark:border-mono-800/60 backdrop-blur-xl shadow-sm mb-6">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-mono-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tempat, lokasi, atau catatan..."
            className="w-full pl-11 pr-4 py-2 bg-transparent text-sm font-medium focus:outline-none placeholder:text-mono-400 text-mono-900 dark:text-mono-100"
          />
        </div>

        {/* Filter per tipe & Sort */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 px-2 lg:px-0 scrollbar-hide">
          <div className="flex items-center gap-1 bg-mono-200/50 dark:bg-mono-950/50 p-1 rounded-xl">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all duration-300 ${
                  selectedType === t
                    ? "bg-white dark:bg-mono-800 text-mono-900 dark:text-mono-100 font-bold shadow-sm"
                    : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100 hover:bg-mono-200/50 dark:hover:bg-mono-800/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="px-4 py-2 bg-mono-200/50 dark:bg-mono-950/50 hover:bg-mono-200 dark:hover:bg-mono-800 rounded-xl text-xs font-mono text-mono-700 dark:text-mono-300 font-semibold transition-colors shrink-0"
          >
            {sortOrder === "newest" ? "Terbaru ↓" : "Terlama ↑"}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-2xl p-8">
          <MapPin className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700 mb-2" />
          <p className="text-sm font-medium text-mono-600 dark:text-mono-400">Tidak ada singgahan yang sesuai</p>
          <p className="text-xs text-mono-400 mt-1">Coba kata kunci pencarian lain atau tambahkan tempat baru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlaces.map((place) => {
            const firstMedia = place.media && place.media.length > 0 ? place.media[0] : null;
            return (
              <Link
                key={place.id}
                href={`/app/album/${place.id}`}
                onClick={() => onSelectPlace?.(place)}
                className="group relative cursor-pointer bg-mono-100 dark:bg-mono-900 border border-mono-200/50 dark:border-mono-800/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-900/10 dark:hover:shadow-blue-900/30 transition-all duration-300 hover:-translate-y-1 flex flex-col aspect-[4/5]"
              >
                {/* Background Image / Fallback */}
                <div className="absolute inset-0 bg-gradient-to-br from-mono-200 to-mono-100 dark:from-mono-800 dark:to-mono-900 z-0">
                  {firstMedia ? (
                    firstMedia.type === "photo" ? (
                      <img
                        src={firstMedia.storageUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <video
                        src={firstMedia.storageUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-mono-400/30">
                      <ImageIcon className="w-16 h-16 mb-2" />
                    </div>
                  )}
                </div>

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <div className="px-3 py-1 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md text-white border border-white/20 font-mono text-[10px] uppercase tracking-widest font-bold shadow-lg">
                    {place.type}
                  </div>
                  {place.media && place.media.length > 1 && (
                    <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 text-[10px] font-mono flex items-center gap-1.5 shadow-lg">
                      <ImageIcon className="w-3 h-3" />
                      +{place.media.length - 1}
                    </div>
                  )}
                </div>

                {/* Favorite Toggle Button */}
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFavorite(place.id);
                    }}
                    className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl border border-white/10 ${
                      place.isFavorite
                        ? "bg-amber-400 text-amber-950 scale-110"
                        : "bg-black/30 text-white hover:bg-black/60 hover:scale-105"
                    }`}
                    title={place.isFavorite ? "Batal Favorit" : "Tandai Favorit"}
                  >
                    <Star className={`w-4 h-4 ${place.isFavorite ? "fill-amber-950" : ""}`} />
                  </button>
                )}

                {/* Content Body at the Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-bold text-xl text-white group-hover:text-blue-300 transition-colors truncate mb-1">
                    {place.name}
                  </h3>
                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed mb-4 group-hover:text-white/90 transition-colors">
                    {place.notes || "Tidak ada catatan."}
                  </p>

                  <div className="flex items-center justify-between font-mono text-[10px] text-white/50 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(place.visitedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {place.latitude.toFixed(2)}, {place.longitude.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
