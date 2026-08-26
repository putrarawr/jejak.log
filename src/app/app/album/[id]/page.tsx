"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import CameraCaptureModal from "@/components/camera/CameraCaptureModal";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function DedicatedAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params?.id as string;

  const [place, setPlace] = useState<any | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function fetchAlbum() {
      if (!user) return;
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("id", albumId)
        .single();
      
      if (data) {
        setPlace({
          id: data.id,
          name: data.name,
          type: data.type,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
          visitedAt: data.visited_at,
          isPublic: data.is_public,
          media: data.media_json,
        });
      }
    }
    fetchAlbum();
  }, [user, albumId]);

  const handleUpdateCurrentPlace = async (updatedPlace: any) => {
    setPlace(updatedPlace);
    await supabase.from("places").update({ media_json: updatedPlace.media }).eq("id", updatedPlace.id);
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
    if (!place || !user) return;
    setIsUploading(true);
    
    try {
      const file = dataURLtoFile(dataUrl, `camera-${Date.now()}.jpg`);
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);

      const currentMedia = place.media || [];
      const newMediaItem = {
        id: fileName,
        storageUrl: publicUrl,
        type: "photo",
      };
      
      const updatedMedia = [...currentMedia, newMediaItem];
      const updatedPlace = { ...place, media: updatedMedia };

      await handleUpdateCurrentPlace(updatedPlace);
      setActiveMediaIndex(updatedMedia.length - 1);
      
      setToastMsg("Foto kamera berhasil diunggah ke cloud!");
    } catch (err) {
      alert("Gagal mengunggah foto kamera.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setToastMsg(""), 3500);
    }
  };

  const handleAddMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !place || !user) return;

    setIsUploading(true);
    const newMediaItems: { id: string; storageUrl: string; type: string }[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video");
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
        
        newMediaItems.push({
          id: fileName,
          storageUrl: publicUrl,
          type: isVideo ? "video" : "photo",
        });
      }

      const currentMedia = place.media || [];
      const updatedMedia = [...currentMedia, ...newMediaItems];
      const updatedPlace = { ...place, media: updatedMedia };

      await handleUpdateCurrentPlace(updatedPlace);
      setActiveMediaIndex(updatedMedia.length - 1);
      
      setToastMsg(`${newMediaItems.length} media berhasil diunggah!`);
    } catch (err) {
      alert("Gagal mengunggah file media.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
      setTimeout(() => setToastMsg(""), 3000);
    }
  };

  const handleDeleteSingleMedia = async (mediaIdToDelete?: string, indexToDelete?: number) => {
    if (!place) return;
    const currentMedia = place.media || [];
    if (currentMedia.length <= 1) {
      alert("Album minimal harus memiliki 1 foto/video.");
      return;
    }

    const updatedMedia = currentMedia.filter((m: any, idx: number) => {
      if (mediaIdToDelete) return m.id !== mediaIdToDelete;
      return idx !== indexToDelete;
    });

    const updatedPlace = { ...place, media: updatedMedia };
    await handleUpdateCurrentPlace(updatedPlace);
    setActiveMediaIndex((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteEntireAlbum = async () => {
    if (!place) return;
    if (confirm(`Apakah Anda yakin ingin menghapus album "${place.name}" dari Cloud?`)) {
      await supabase.from("places").delete().eq("id", place.id);
      router.push("/app");
    }
  };

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100">
        <div className="text-center font-mono">
          <p>Memuat album...</p>
        </div>
      </div>
    );
  }

  const mediaList = place.media && place.media.length > 0 ? place.media : [];
  const currentMediaItem = mediaList[activeMediaIndex] || mediaList[0];

  return (
    <div className="min-h-screen bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 flex flex-col pb-16">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-mono-900/90 backdrop-blur-md border-b border-mono-200 dark:border-mono-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-xs font-mono font-medium text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>

          <div className="text-center truncate px-2">
            <h1 className="font-bold text-sm tracking-tight truncate">{place.name}</h1>
            <span className="font-mono text-[10px] text-mono-400 uppercase">{place.type}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteEntireAlbum}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
              title="Hapus Album"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {toastMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs rounded-xl flex items-center justify-between shadow-md animate-in fade-in duration-200">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-mono-400 hover:text-mono-900 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          {isUploading && (
            <div className="w-full flex items-center justify-center mb-2">
              <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-mono font-medium rounded-full animate-pulse flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                Mengunggah ke Cloud...
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => setIsCameraModalOpen(true)}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-bold rounded-xl text-xs hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50"
            >
              <Camera className="w-5 h-5 stroke-[2.5]" />
              <span>Kamera Langsung (Jepret Foto)</span>
            </button>

            <label
              htmlFor="file-upload"
              className={`flex items-center gap-2 px-4 py-2.5 bg-mono-100 dark:bg-mono-800 text-mono-900 dark:text-mono-100 font-bold rounded-xl text-xs cursor-pointer hover:bg-mono-200 dark:hover:bg-mono-700 transition ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-4 h-4" />
              Upload Galeri HP
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              disabled={isUploading}
              onChange={handleAddMediaFiles}
            />
          </div>
          <span className="font-mono text-[10px] text-mono-400">
            Pencet Kamera Langsung untuk jepret foto HP & otomatis masuk ke album ini
          </span>
        </div>

        {/* Mobile Portrait Photo Feed Grid (3:4 / 9:16 Camera Format) */}
        <div className="bg-white dark:bg-mono-900 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider font-mono text-mono-500 dark:text-mono-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Koleksi Foto & Video Album ({mediaList.length})
            </h3>
            <span className="font-mono text-[10px] text-mono-400">
              Ketuk foto untuk perbesar
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {mediaList.map((m: any, idx: number) => (
              <div
                key={m.id || idx}
                onClick={() => {
                  setActiveMediaIndex(idx);
                  setIsFullscreenModalOpen(true);
                }}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-mono-200 dark:border-mono-800 shadow-sm hover:shadow-md transition-all duration-150 active:scale-95`}
              >
                {m.type === "photo" ? (
                  <img
                    src={m.storageUrl}
                    alt={`Photo ${idx}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-mono-900 flex items-center justify-center relative">
                    <video src={m.storageUrl} className="w-full h-full object-cover opacity-70" />
                    <Video className="w-6 h-6 text-white absolute drop-shadow-md" />
                  </div>
                )}

                {/* Index badge */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-mono-900/80 backdrop-blur-md text-white font-mono text-[9px]">
                  #{idx + 1}
                </div>

                {/* Delete button overlay on single image */}
                {mediaList.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingleMedia(m.id, idx);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow hover:scale-110"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Exploration Details & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notes */}
          {place.notes && (
            <div className="bg-white dark:bg-mono-900 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm">
              <h3 className="font-mono text-xs text-mono-400 uppercase tracking-wider mb-2">
                Catatan Eksplorasi
              </h3>
              <p className="text-xs sm:text-sm text-mono-800 dark:text-mono-200 leading-relaxed whitespace-pre-line">
                {place.notes}
              </p>
            </div>
          )}

          {/* Location Map */}
          <div className="bg-white dark:bg-mono-900 p-4 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between font-mono text-xs text-mono-400">
              <span className="flex items-center gap-1 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" /> Lokasi Peta
              </span>
              <span>
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </span>
            </div>
            <div className="h-48 rounded-xl overflow-hidden border border-mono-200 dark:border-mono-800">
              <InteractiveMap places={[place]} isMiniMap={true} onSelectPlace={() => {}} />
            </div>
          </div>
        </div>
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
    </div>
  );
}
