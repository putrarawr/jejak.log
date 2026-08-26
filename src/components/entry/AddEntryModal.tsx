"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Camera,
  Upload,
  Calendar,
  Tag,
  FileText,
  Navigation,
  Globe,
  Lock,
} from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
});

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (newPlace: any) => Promise<void> | void;
}

const DEFAULT_TYPES = ["kuliner", "alam", "kota", "sejarah", "kopi", "custom"];

export default function AddEntryModal({
  isOpen,
  onClose,
  onAddPlace,
}: AddEntryModalProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [type, setType] = useState("kuliner");
  const [customType, setCustomType] = useState("");
  const [notes, setNotes] = useState("");
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split("T")[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ url: string; type: "photo" | "video"; file?: File }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Location
  const [latitude, setLatitude] = useState<number>(-6.2088);
  const [longitude, setLongitude] = useState<number>(106.8456);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  const handlePasteMapsLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMapsLink(val);
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = val.match(regex);
    if (match) {
      setLatitude(parseFloat(match[1]));
      setLongitude(parseFloat(match[2]));
      alert("📍 Koordinat berhasil diekstrak otomatis dari link Google Maps!");
    } else if (val.includes("maps.app.goo.gl") || val.includes("goo.gl/maps")) {
      alert("⚠️ Link pendek tidak bisa dibaca otomatis. Buka linknya dulu di browser HP Anda, lalu copy URL panjangnya (yang ada tanda '@' nya).");
    }
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video");
      const url = URL.createObjectURL(file);
      setMediaFiles((prev) => [...prev, { url, type: isVideo ? "video" : "photo", file }]);
    });
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation GPS.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsDetectingGps(false);
      },
      (err) => {
        alert(`Gagal mengambil posisi GPS (${err.message}). Pastikan izin diberikan DAN website diakses melalui HTTPS atau localhost.`);
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
    );
  };

  const handleGeocodeSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        alert(`Lokasi ditemukan: ${data[0].display_name}`);
      } else {
        alert("Lokasi tidak ditemukan. Coba kata kunci lain.");
      }
    } catch (err) {
      alert("Gagal mencari lokasi.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isUploading) return;

    setIsUploading(true);
    const selectedType = type === "custom" && customType ? customType : type;

    try {
      const uploadedMedia = [];
      if (mediaFiles.length > 0) {
        for (const m of mediaFiles) {
          if (m.file && user) {
            const fileExt = m.file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("media")
              .upload(fileName, m.file);

            if (uploadError) {
              console.error("Upload error:", uploadError);
              throw new Error("Gagal mengupload file media.");
            }

            const { data: { publicUrl } } = supabase.storage
              .from("media")
              .getPublicUrl(fileName);

            uploadedMedia.push({
              id: fileName,
              storageUrl: publicUrl,
              type: m.type,
            });
          } else if (!m.file) {
            // Jika tidak ada file fisik (misal edit), gunakan URL yang ada
            uploadedMedia.push({
              id: "media-" + Date.now(),
              storageUrl: m.url,
              type: m.type,
            });
          }
        }
      } else {
        uploadedMedia.push({
          id: "default-photo",
          storageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
          type: "photo",
        });
      }

      const newPlace = {
        name,
        type: selectedType,
        latitude,
        longitude,
        notes,
        visited_at: new Date(visitedAt).toISOString(),
        is_public: isPublic,
        media_json: uploadedMedia, // We map this for Supabase insert
      };

      await onAddPlace(newPlace);
      
      // Cleanup & Reset Form
      setName("");
      setNotes("");
      setCustomType("");
      setMediaFiles([]);
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-mono-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-mono-100 dark:border-mono-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base tracking-tight">Catat Singgahan Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nama Tempat */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
              Nama Tempat *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Titik Temu, Bukit Sikunir"
              className="w-full px-3.5 py-2.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
            />
          </div>

          {/* Tipe Tempat & Tag */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
              Kategori / Tipe Tempat
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DEFAULT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition ${
                    type === t
                      ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-semibold"
                      : "bg-mono-100 dark:bg-mono-800 text-mono-600 dark:text-mono-400 hover:bg-mono-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {type === "custom" && (
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Tulis tipe custom..."
                className="w-full px-3.5 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900"
              />
            )}
          </div>

          {/* Tanggal Kunjungan */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
              Tanggal Kunjungan
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mono-400" />
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900"
              />
            </div>
          </div>

          {/* Lokasi Pin / GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400">
                Koordinat Lokasi Peta
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                className="text-[11px] font-mono text-mono-900 dark:text-mono-100 flex items-center gap-1 hover:underline"
              >
                <Navigation className="w-3 h-3" />
                {isDetectingGps ? "Mendeteksi..." : "Deteksi GPS"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                placeholder="Latitude"
                className="px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs font-mono"
              />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                placeholder="Longitude"
                className="px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs font-mono"
              />
            </div>

            {/* Geocode Search */}
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi (contoh: Monas, Bandung)"
                className="flex-1 px-3 py-1.5 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleGeocodeSearch}
                className="px-3 py-1.5 bg-mono-200 dark:bg-mono-800 hover:bg-mono-300 text-xs font-mono rounded-xl transition"
              >
                Cari
              </button>
            </div>

            {/* Paste Maps Link Fallback */}
            <div className="mb-3">
              <input
                type="text"
                value={mapsLink}
                onChange={handlePasteMapsLink}
                placeholder="Atau Paste URL Google Maps di sini (harus ada @lat,lng)"
                className="w-full px-3 py-2 bg-mono-50 dark:bg-mono-950 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs font-mono focus:border-blue-500 transition placeholder:text-[10px]"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsMapPickerOpen(!isMapPickerOpen)}
              className="w-full py-2 bg-mono-100 dark:bg-mono-800 border border-dashed border-mono-300 dark:border-mono-700 rounded-xl text-xs font-mono text-mono-700 dark:text-mono-300 flex items-center justify-center gap-1.5 hover:bg-mono-200 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              {isMapPickerOpen ? "Tutup Peta Picker" : "Pilih Titik di Peta Interaktif"}
            </button>

            {isMapPickerOpen && (
              <div className="mt-2 flex flex-col gap-2">
                <div className="h-56 rounded-xl overflow-hidden border border-mono-300 dark:border-mono-700 relative">
                  <InteractiveMap
                    places={[]}
                    onSelectPlace={() => {}}
                    isPickerMode={true}
                    pickedLocation={{ lat: latitude, lng: longitude }}
                    onPickLocation={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </div>
                {/* Tip Card Below Map */}
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-xl text-[11px] flex items-start gap-2 border border-blue-100 dark:border-blue-800/30 leading-relaxed">
                  <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong className="font-semibold block mb-0.5">Panduan Memilih Lokasi (Khusus HP):</strong>
                    Jika tombol <b>Deteksi GPS</b> di atas tidak berfungsi pada perangkat Anda, silakan geser pin pada peta interaktif ini secara manual atau gunakan kolom Paste Link Google Maps.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Foto & Video / Kamera */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
              Foto Utama (Thumbnail Album) & Video
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer py-3 px-3 border border-dashed border-mono-300 dark:border-mono-700 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-xl flex flex-col items-center justify-center gap-1 text-center transition">
                <Upload className="w-5 h-5 text-mono-400" />
                <span className="text-xs font-medium">Galeri HP / PC</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer py-3 px-3 border border-dashed border-mono-300 dark:border-mono-700 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-xl flex flex-col items-center justify-center gap-1 text-center transition">
                <Camera className="w-5 h-5 text-mono-400" />
                <span className="text-xs font-medium">Kamera HP Langsung</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview Thumbnails */}
            {mediaFiles.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-2 overflow-x-auto py-2">
                  {mediaFiles.map((m, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-mono-300 shrink-0">
                      {i === 0 && (
                        <div className="absolute top-0 left-0 w-full bg-blue-500/80 text-white text-[8px] font-bold text-center py-0.5 z-10 backdrop-blur-sm">
                          THUMBNAIL
                        </div>
                      )}
                      {m.type === "photo" ? (
                        <img src={m.url} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.url} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-mono-500 font-mono mt-1">
                  *Foto pertama akan digunakan sebagai gambar sampul (thumbnail) album di halaman depan.
                </p>
              </div>
            )}
          </div>

          {/* Catatan / Journal Notes */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-mono-500 dark:text-mono-400 mb-1">
              Catatan & Kenangan (Opsional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ceritakan momen menarik atau suasana di tempat ini..."
              className="w-full px-3.5 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mono-900"
            />
          </div>

          {/* Public vs Private Toggle */}
          <div className="flex items-center justify-between p-3 bg-mono-100/60 dark:bg-mono-800/40 rounded-xl border border-mono-200 dark:border-mono-800">
            <div className="flex items-center gap-2">
              {isPublic ? <Globe className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-mono-400" />}
              <div>
                <p className="text-xs font-medium">{isPublic ? "Publik" : "Privat (Default)"}</p>
                <p className="text-[10px] text-mono-500">
                  {isPublic ? "Tampil di profil publik Anda" : "Hanya dapat dilihat oleh Anda"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-10 h-6 rounded-full transition p-1 ${
                isPublic ? "bg-mono-900 dark:bg-mono-100" : "bg-mono-300 dark:bg-mono-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white dark:bg-mono-900 transition-transform ${
                  isPublic ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-mono-200 dark:border-mono-800">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3.5 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 rounded-xl text-sm font-bold shadow-lg shadow-mono-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></div>
                  Menyimpan ke Cloud...
                </>
              ) : (
                "Simpan Singgahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
