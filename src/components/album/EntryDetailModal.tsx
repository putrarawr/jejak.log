"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Tag,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Plus,
  Upload,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

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

interface EntryDetailModalProps {
  place: PlaceItem | null;
  onClose: () => void;
  onDeletePlace: (id: string) => void;
  onUpdatePlace?: (updatedPlace: PlaceItem) => void;
}

export default function EntryDetailModal({
  place,
  onClose,
  onDeletePlace,
  onUpdatePlace,
}: EntryDetailModalProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  if (!place) return null;

  const mediaList = place.media && place.media.length > 0 ? place.media : [];

  const handleNextMedia = () => {
    if (mediaList.length > 0) {
      setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
    }
  };

  const handlePrevMedia = () => {
    if (mediaList.length > 0) {
      setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    }
  };

  const handleAddMediaFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpdatePlace) return;

    const newMediaItems: { id: string; storageUrl: string; type: string }[] = [];
    Array.from(files).forEach((file, i) => {
      const isVideo = file.type.startsWith("video");
      const url = URL.createObjectURL(file);
      newMediaItems.push({
        id: `media-${Date.now()}-${i}`,
        storageUrl: url,
        type: isVideo ? "video" : "photo",
      });
    });

    const updatedMedia = [...mediaList, ...newMediaItems];
    const updatedPlace: PlaceItem = {
      ...place,
      media: updatedMedia,
    };

    onUpdatePlace(updatedPlace);
    setActiveMediaIndex(mediaList.length); // focus on first newly added media
  };

  const handleDeleteSingleMedia = (mediaIdToDelete?: string, indexToDelete?: number) => {
    if (!onUpdatePlace) return;
    if (mediaList.length <= 1) {
      alert("Album minimal harus memiliki 1 foto/video.");
      return;
    }

    const updatedMedia = mediaList.filter((m, idx) => {
      if (mediaIdToDelete) return m.id !== mediaIdToDelete;
      return idx !== indexToDelete;
    });

    const updatedPlace: PlaceItem = {
      ...place,
      media: updatedMedia,
    };

    onUpdatePlace(updatedPlace);
    setActiveMediaIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-mono-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-mono-100 dark:border-mono-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-[10px] uppercase tracking-wider">
                {place.type}
              </span>
              {place.isPublic ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                  <Globe className="w-3 h-3" /> Publik
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-mono-400 text-xs font-mono">
                  <Lock className="w-3 h-3" /> Privat
                </span>
              )}
            </div>
            <h2 className="font-bold text-xl tracking-tight mt-1 text-mono-900 dark:text-mono-100">
              {place.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin menghapus seluruh album singgahan ini?")) {
                  onDeletePlace(place.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
              title="Hapus Singgahan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Lightbox View */}
          {mediaList.length > 0 && activeMediaIndex < mediaList.length && (
            <div className="relative aspect-[16/9] bg-mono-950 rounded-xl overflow-hidden group">
              {mediaList[activeMediaIndex].type === "photo" ? (
                <img
                  src={mediaList[activeMediaIndex].storageUrl}
                  alt={place.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={mediaList[activeMediaIndex].storageUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              )}

              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-mono-900/60 text-white hover:bg-mono-900 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-mono-900/60 text-white hover:bg-mono-900 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-mono-900/70 text-white font-mono text-xs">
                    {activeMediaIndex + 1} / {mediaList.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Album Media Collection & Upload Button */}
          <div className="bg-mono-50 dark:bg-mono-950 p-4 rounded-xl border border-mono-200 dark:border-mono-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs text-mono-500 dark:text-mono-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Isi Album ({mediaList.length} foto & video)
              </h4>

              {/* Add Photo Button */}
              <label className="cursor-pointer px-3 py-1.5 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-medium text-xs rounded-lg flex items-center gap-1.5 transition shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Foto/Video</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleAddMediaFiles}
                  className="hidden"
                />
              </label>
            </div>

            {/* Thumbnails list */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
              {mediaList.map((m, idx) => (
                <div
                  key={m.id || idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border transition ${
                    activeMediaIndex === idx
                      ? "ring-2 ring-mono-900 dark:ring-mono-100 border-transparent scale-95"
                      : "border-mono-200 dark:border-mono-800 opacity-70 hover:opacity-100"
                  }`}
                >
                  {m.type === "photo" ? (
                    <img src={m.storageUrl} alt="album item" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-mono-900 flex items-center justify-center relative">
                      <video src={m.storageUrl} className="w-full h-full object-cover opacity-60" />
                      <Video className="w-4 h-4 text-white absolute" />
                    </div>
                  )}

                  {/* Delete single media button */}
                  {mediaList.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingleMedia(m.id, idx);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow hover:scale-110"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Description */}
          {place.notes && (
            <div className="bg-mono-50 dark:bg-mono-950 p-4 rounded-xl border border-mono-200 dark:border-mono-800">
              <h4 className="font-mono text-xs text-mono-400 uppercase tracking-wider mb-1">
                Catatan Eksplorasi
              </h4>
              <p className="text-sm text-mono-700 dark:text-mono-300 leading-relaxed whitespace-pre-line">
                {place.notes}
              </p>
            </div>
          )}

          {/* Location & Map Indicator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-mono text-xs text-mono-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Lokasi di Peta ({place.latitude.toFixed(4)}, {place.longitude.toFixed(4)})
              </h4>
              <span className="font-mono text-xs text-mono-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(place.visitedAt).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="h-52 rounded-xl overflow-hidden border border-mono-200 dark:border-mono-800">
              <InteractiveMap
                places={[place]}
                onSelectPlace={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
