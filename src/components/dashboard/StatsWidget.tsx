"use client";

import React, { useMemo } from "react";
import { MapPin, Camera, Tag, Globe, Lock, Sparkles, TrendingUp } from "lucide-react";

interface PlaceItem {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  notes?: string;
  visitedAt: string;
  isPublic: boolean;
  media?: { storageUrl: string; type: string }[];
}

interface StatsWidgetProps {
  places: PlaceItem[];
}

export default function StatsWidget({ places }: StatsWidgetProps) {
  const stats = useMemo(() => {
    const totalPlaces = places.length;
    
    let totalMediaCount = 0;
    const categoryCounts: Record<string, number> = {};
    let publicCount = 0;

    places.forEach((p) => {
      if (p.media && Array.isArray(p.media)) {
        totalMediaCount += p.media.length;
      }
      if (p.isPublic) {
        publicCount += 1;
      }
      categoryCounts[p.type] = (categoryCounts[p.type] || 0) + 1;
    });

    // Find top category
    let topCategory = "-";
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    return {
      totalPlaces,
      totalMediaCount,
      topCategory,
      publicCount,
      privateCount: totalPlaces - publicCount,
    };
  }, [places]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Total Places */}
      <div className="bg-white/80 dark:bg-mono-900/80 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <span className="font-mono text-xl font-bold block text-mono-900 dark:text-mono-100">
            {stats.totalPlaces}
          </span>
          <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
            Total Singgahan
          </span>
        </div>
      </div>

      {/* Total Media */}
      <div className="bg-white/80 dark:bg-mono-900/80 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <span className="font-mono text-xl font-bold block text-mono-900 dark:text-mono-100">
            {stats.totalMediaCount}
          </span>
          <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
            Foto & Video
          </span>
        </div>
      </div>

      {/* Top Category */}
      <div className="bg-white/80 dark:bg-mono-900/80 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div className="truncate">
          <span className="font-mono text-base font-bold capitalize block text-mono-900 dark:text-mono-100 truncate">
            {stats.topCategory}
          </span>
          <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
            Top Kategori
          </span>
        </div>
      </div>

      {/* Public vs Private Ratio */}
      <div className="bg-white/80 dark:bg-mono-900/80 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <span className="font-mono text-xl font-bold block text-mono-900 dark:text-mono-100">
            {stats.publicCount} <span className="text-xs text-mono-400 font-normal">/ {stats.totalPlaces}</span>
          </span>
          <span className="font-mono text-[10px] text-mono-400 uppercase tracking-wider">
            Akses Publik
          </span>
        </div>
      </div>
    </div>
  );
}
