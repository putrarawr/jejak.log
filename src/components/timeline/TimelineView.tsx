"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, ImageIcon, Globe, Lock, Clock } from "lucide-react";

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

interface TimelineViewProps {
  places: PlaceItem[];
  onSelectPlace?: (place: PlaceItem) => void;
  onDeletePlace?: (id: string) => void;
}

export default function TimelineView({ places, onSelectPlace }: TimelineViewProps) {
  // Sort places chronologically (Newest first) and group by Month/Year
  const groupedTimeline = useMemo(() => {
    const sorted = [...places].sort(
      (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
    );

    const groups: { monthYear: string; items: PlaceItem[] }[] = [];

    sorted.forEach((item) => {
      const date = new Date(item.visitedAt);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      const existingGroup = groups.find((g) => g.monthYear === monthYear);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ monthYear, items: [item] });
      }
    });

    return groups;
  }, [places]);

  if (places.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-mono-900 border border-dashed border-mono-200 dark:border-mono-800 rounded-3xl p-8">
        <Clock className="w-8 h-8 mx-auto text-mono-300 dark:text-mono-700 mb-2 animate-pulse" />
        <p className="text-sm font-medium text-mono-600 dark:text-mono-400">
          Belum ada riwayat timeline kronologis
        </p>
        <p className="text-xs text-mono-400 mt-1">
          Tambahkan singgahan pertama Anda untuk mulai membentuk jurnal garis waktu eksplorasi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-32 before:w-0.5 before:bg-mono-200 dark:before:bg-mono-800">
      {groupedTimeline.map((group, groupIdx) => (
        <div key={group.monthYear || groupIdx} className="space-y-4 relative">
          {/* Month Header Banner */}
          <div className="flex items-center gap-3 sticky top-16 z-20">
            <div className="w-8 sm:w-32 text-left shrink-0">
              <span className="inline-block px-3 py-1 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-xl shadow-md uppercase tracking-wider">
                {group.monthYear}
              </span>
            </div>
            <div className="flex-1 h-px bg-mono-200 dark:border-mono-800" />
          </div>

          {/* Timeline Node Cards */}
          <div className="space-y-4 pl-8 sm:pl-36">
            {group.items.map((place) => {
              const firstMedia = place.media && place.media.length > 0 ? place.media[0] : null;
              const dateObj = new Date(place.visitedAt);

              return (
                <div key={place.id} className="relative group">
                  {/* Timeline Bullet Node */}
                  <div className="absolute -left-[33px] sm:-left-[21px] top-6 w-3.5 h-3.5 rounded-full bg-mono-900 dark:bg-mono-100 border-2 border-white dark:border-mono-950 shadow-md group-hover:scale-125 transition-transform" />

                  <Link
                    href={`/app/album/${place.id}`}
                    onClick={() => onSelectPlace && onSelectPlace(place)}
                    className="block bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-mono-300 dark:hover:border-mono-700 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex gap-4 items-center">
                        {firstMedia ? (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-mono-200 dark:border-mono-800">
                            {firstMedia.type === "photo" ? (
                              <img
                                src={firstMedia.storageUrl}
                                alt={place.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <video src={firstMedia.storageUrl} className="w-full h-full object-cover" />
                            )}
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-mono-100 dark:bg-mono-800 flex items-center justify-center shrink-0 text-mono-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-mono-100 dark:bg-mono-800 text-mono-700 dark:text-mono-300 font-mono text-[10px] uppercase font-bold">
                              {place.type}
                            </span>
                            <span className="font-mono text-[11px] text-mono-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dateObj.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-mono-900 dark:text-mono-100 group-hover:text-blue-500 transition-colors">
                            {place.name}
                          </h3>

                          <p className="text-xs text-mono-500 dark:text-mono-400 line-clamp-2 leading-relaxed">
                            {place.notes || "Tidak ada catatan."}
                          </p>

                          <div className="flex items-center gap-3 pt-1 font-mono text-[10px] text-mono-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
                            </span>
                            <span className="flex items-center gap-1">
                              {place.isPublic ? (
                                <Globe className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Lock className="w-3 h-3 text-mono-400" />
                              )}
                              {place.isPublic ? "Publik" : "Privat"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="self-end sm:self-center shrink-0">
                        <span className="px-3 py-1.5 bg-mono-100 dark:bg-mono-800 group-hover:bg-mono-900 group-hover:text-white dark:group-hover:bg-mono-100 dark:group-hover:text-mono-900 text-mono-700 dark:text-mono-300 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
                          <span>Buka Album</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
