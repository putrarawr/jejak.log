"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import CameraCaptureModal from "@/components/camera/CameraCaptureModal";
import EditEntryModal from "@/components/entry/EditEntryModal";
import SocialActions from "@/components/social/SocialActions";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Trash2,
  Plus,
  Upload,
  Camera,
  Image as ImageIcon,
  Video,
  Compass,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

export default function DedicatedAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params?.id as string;

  const [place, setPlace] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { user, isGuestMode } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchAlbum() {
      if (!albumId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      let foundPlace: any = null;

      // 1. Try Supabase DB query
      try {
        const { data } = await supabase
          .from("places")
          .select("*")
          .eq("id", albumId)
          .maybeSingle();

        if (data) {
          foundPlace = {
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
        }
      } catch (e) {
        console.warn("DB album fetch notice:", e);
      }

      // 2. Search local storage backups if DB returned empty
      if (!foundPlace && typeof window !== "undefined") {
        try {
          // Check user storage first
          if (user?.id) {
            const userSaved = localStorage.getItem(`jejaklog_places_${user.id}`);
            if (userSaved) {
              const parsed = JSON.parse(userSaved);
              if (Array.isArray(parsed)) {
                foundPlace = parsed.find((p: any) => p.id === albumId);
              }
            }
          }

          // Check guest storage
          if (!foundPlace) {
            const guestSaved = localStorage.getItem("jejaklog_places_guest");
            if (guestSaved) {
              const parsed = JSON.parse(guestSaved);
              if (Array.isArray(parsed)) {
                foundPlace = parsed.find((p: any) => p.id === albumId);
              }
            }
          }

          // Check all remaining localStorage keys
          if (!foundPlace) {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("jejaklog_places")) {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) {
                    const match = parsed.find((p: any) => p.id === albumId);
                    if (match) {
                      foundPlace = match;
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn("Local storage album search notice:", err);
        }
      }

      if (isMounted) {
        if (foundPlace) {
          setPlace(foundPlace);
        }
        setIsLoading(false);
      }
    }

    fetchAlbum();

    return () => {
      isMounted = false;
    };
  }, [albumId, user]);

  const handleUpdateCurrentPlace = async (updatedPlace: any) => {
    setPlace(updatedPlace);

    if (user && !isGuestMode) {
      try {
        await supabase
          .from("places")
          .upsert({
            id: updatedPlace.id,
            user_id: user.id,
            name: updatedPlace.name,
            type: updatedPlace.type,
            latitude: updatedPlace.latitude,
            longitude: updatedPlace.longitude,
            notes: updatedPlace.notes,
            visited_at: updatedPlace.visitedAt,
            is_public: updatedPlace.isPublic,
            media_json: updatedPlace.media,
          });
      } catch (e) {}

      const userKey = `jejaklog_places_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(userKey) || "[]");
      const filtered = saved.filter((p: any) => p.id !== updatedPlace.id);
      localStorage.setItem(userKey, JSON.stringify([updatedPlace, ...filtered]));
    } else {
      const savedPlaces = JSON.parse(localStorage.getItem("jejaklog_places_guest") || "[]");
      const filtered = savedPlaces.filter((p: any) => p.id !== updatedPlace.id);
      localStorage.setItem("jejaklog_places_guest", JSON.stringify([updatedPlace, ...filtered]));
    }
  };

  const [toastMsg, setToastMsg] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const match = arr[0].match(/:(.*?);/);
    const mime = match ? match[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCapturePhotoFromCamera = async (dataUrl: string) => {
    if (!place) return;
    setIsUploading(true);

    try {
      let publicUrl = dataUrl;

      if (user && !isGuestMode) {
        try {
          const file = dataURLtoFile(dataUrl, `camera-${Date.now()}.jpg`);
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

          const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
            if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
          }
        } catch (e) {}
      }

      const currentMedia = place.media || [];
      const newMediaItem = {
        id: `m-${Date.now()}`,
        storageUrl: publicUrl,
        type: "photo",
      };

      const updatedMedia = [...currentMedia, newMediaItem];
      const updatedPlace = { ...place, media: updatedMedia };

      await handleUpdateCurrentPlace(updatedPlace);
      setActiveMediaIndex(updatedMedia.length - 1);
      toast.success("Foto dari kamera berhasil ditambahkan!");
    } catch (err: any) {
      toast.error("Gagal menambahkan foto dari kamera.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !place) return;

    setIsUploading(true);
    const newMediaItems: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        let fileUrl = "";

        if (user && !isGuestMode) {
          try {
            const ext = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${ext}`;
            const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
              if (urlData?.publicUrl) fileUrl = urlData.publicUrl;
            }
          } catch (e) {}
        }

        if (!fileUrl) {
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        newMediaItems.push({
          id: `m-${Date.now()}-${i}`,
          storageUrl: fileUrl,
          type: isVideo ? "video" : "photo",
        });
      }

      const currentMedia = place.media || [];
      const updatedMedia = [...currentMedia, ...newMediaItems];
      const updatedPlace = { ...place, media: updatedMedia };

      await handleUpdateCurrentPlace(updatedPlace);
      setActiveMediaIndex(updatedMedia.length - 1);
      toast.success(`${newMediaItems.length} berkas media berhasil diunggah!`);
    } catch (err: any) {
      toast.error("Gagal mengunggah media.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!place) return;
    const currentMedia = place.media || [];
    const updatedMedia = currentMedia.filter((m: any) => m.id !== mediaId);
    const updatedPlace = { ...place, media: updatedMedia };

    await handleUpdateCurrentPlace(updatedPlace);
    if (activeMediaIndex >= updatedMedia.length) {
      setActiveMediaIndex(Math.max(0, updatedMedia.length - 1));
    }
    toast.success("Berkas media dihapus");
  };

  const handleDeleteEntirePlace = async () => {
    if (!place) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus "${place.name}" secara permanen?`)) return;

    if (user && !isGuestMode) {
      try {
        await supabase.from("places").delete().eq("id", place.id);
      } catch (e) {}
      const userKey = `jejaklog_places_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(userKey) || "[]");
      const filtered = saved.filter((p: any) => p.id !== place.id);
      localStorage.setItem(userKey, JSON.stringify(filtered));
    } else {
      const savedPlaces = JSON.parse(localStorage.getItem("jejaklog_places_guest") || "[]");
      const filtered = savedPlaces.filter((p: any) => p.id !== place.id);
      localStorage.setItem("jejaklog_places_guest", JSON.stringify(filtered));
    }

    toast.success(`Singgahan "${place.name}" berhasil dihapus.`);
    router.push("/app");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 font-mono text-xs gap-3">
        <Compass className="w-6 h-6 animate-spin text-mono-400" />
        <span>Memuat Album...</span>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-mono-200 dark:bg-mono-800 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-mono-400" />
        </div>
        <h1 className="text-xl font-bold font-serif">Album Tidak Ditemukan</h1>
        <p className="text-xs text-mono-500 max-w-sm">
          Singgahan ini mungkin telah dihapus atau belum tersinkronisasi.
        </p>
        <Link
          href="/app"
          className="px-5 py-2.5 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow hover:scale-105 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    );
  }

  const mediaList = place.media || [];
  const currentMediaItem = mediaList[activeMediaIndex] || null;

  return (
    <div className="min-h-screen flex flex-col bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-mono-900/80 backdrop-blur-md border-b border-mono-200 dark:border-mono-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-2 font-mono text-xs font-semibold text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-xl transition flex items-center gap-1.5 font-mono text-xs"
              title="Edit Tempat"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Tempat</span>
            </button>

            <button
              onClick={handleDeleteEntirePlace}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center gap-1.5 font-mono text-xs"
              title="Hapus tempat ini"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Hapus Tempat</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Title & Metadata Header */}
        <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mono-100 dark:border-mono-800 pb-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-mono-100 dark:bg-mono-800 text-mono-700 dark:text-mono-300 font-mono text-xs font-bold uppercase tracking-wider">
                {place.type}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight pt-1">
                {place.name}
              </h1>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-mono-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(place.visitedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <span className="text-mono-300">•</span>

              <div className="flex items-center gap-1.5 text-mono-500">
                {place.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Globe className="w-3.5 h-3.5" /> Akses Publik
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-mono-400">
                    <Lock className="w-3.5 h-3.5" /> Privat
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location Map Coordinates */}
          <div className="flex items-center gap-2 font-mono text-xs text-mono-500">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span>
              Koordinat: {place.latitude?.toFixed(4)}, {place.longitude?.toFixed(4)}
            </span>
          </div>

          {/* Place Notes */}
          {place.notes && (
            <div className="bg-mono-50 dark:bg-mono-950 p-4 rounded-2xl border border-mono-200/60 dark:border-mono-800/60 text-xs sm:text-sm text-mono-700 dark:text-mono-300 leading-relaxed font-medium">
              "{place.notes}"
            </div>
          )}
        </div>

        {/* Media Showcase Section */}
        <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <span>Galeri Foto & Video ({mediaList.length})</span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="px-3 py-1.5 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ambil Foto</span>
              </button>

              <label className="cursor-pointer px-3 py-1.5 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 hover:opacity-90 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Media</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Active Media Viewer */}
          {currentMediaItem ? (
            <div className="relative rounded-2xl overflow-hidden bg-mono-950 aspect-video flex items-center justify-center group shadow-xl">
              {currentMediaItem.type === "photo" ? (
                <img
                  src={currentMediaItem.storageUrl}
                  alt={place.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={currentMediaItem.storageUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              )}

              {/* Fullscreen Trigger */}
              <button
                onClick={() => setIsFullscreenModalOpen(true)}
                className="absolute top-3 right-3 p-2 rounded-full bg-mono-900/80 hover:bg-mono-800 text-white opacity-0 group-hover:opacity-100 transition shadow-md backdrop-blur-sm"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Delete Current Media */}
              <button
                onClick={() => handleDeleteMedia(currentMediaItem.id)}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow-md backdrop-blur-sm"
                title="Hapus foto/video ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-mono-200 dark:border-mono-800 rounded-2xl text-center space-y-3">
              <Camera className="w-10 h-10 mx-auto text-mono-400" />
              <p className="font-mono text-xs text-mono-500">Belum ada foto atau video untuk tempat ini.</p>
            </div>
          )}

          {/* Media Thumbnails Carousel Grid */}
          {mediaList.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
              {mediaList.map((m: any, idx: number) => (
                <button
                  key={m.id || idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 relative ${
                    activeMediaIndex === idx
                      ? "border-mono-900 dark:border-mono-100 scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {m.type === "photo" ? (
                    <img src={m.storageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-mono-900 flex items-center justify-center text-white">
                      <Video className="w-6 h-6" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dedicated Interactive Location Map */}
        <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
          <h2 className="font-serif font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span>Peta Lokasi Singgahan</span>
          </h2>

          <div className="h-72 rounded-2xl overflow-hidden border border-mono-200 dark:border-mono-800 relative">
            <InteractiveMap places={[place]} />
          </div>
        </div>

        {/* Social Actions (Likes & Comments for Public Places) */}
        <SocialActions placeId={place.id} isPublic={place.isPublic} />
      </main>

      {/* Lightbox Fullscreen Modal */}
      {isFullscreenModalOpen && currentMediaItem && (
        <div className="fixed inset-0 z-50 bg-mono-950/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-white z-10">
            <span className="font-mono text-xs">
              {place.name} ({activeMediaIndex + 1} / {mediaList.length})
            </span>
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="p-2 rounded-full bg-mono-800 hover:bg-mono-700 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center p-2">
            {mediaList.length > 1 && (
              <button
                onClick={() =>
                  setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))
                }
                className="absolute left-2 z-20 p-3 rounded-full bg-mono-900/80 hover:bg-mono-800 text-white transition shadow-lg backdrop-blur-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentMediaItem.type === "photo" ? (
              <img
                src={currentMediaItem.storageUrl}
                alt={place.name}
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <video
                src={currentMediaItem.storageUrl}
                controls
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            )}

            {mediaList.length > 1 && (
              <button
                onClick={() =>
                  setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-2 z-20 p-3 rounded-full bg-mono-900/80 hover:bg-mono-800 text-white transition shadow-lg backdrop-blur-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* In-App Live Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapturePhoto={handleCapturePhotoFromCamera}
      />

      {/* Edit Place Details Modal */}
      <EditEntryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        place={place}
        onUpdatePlace={handleUpdateCurrentPlace}
      />
    </div>
  );
}
