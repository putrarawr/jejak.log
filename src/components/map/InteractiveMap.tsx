"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Compass,
  Navigation,
  Layers,
  ArrowRight,
  Sparkles,
  Calendar,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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

interface InteractiveMapProps {
  places: PlaceItem[];
  onSelectPlace?: (place: PlaceItem) => void;
  onPickLocation?: (lat: number, lng: number) => void;
  isPickerMode?: boolean;
  pickedLocation?: { lat: number; lng: number } | null;
  isMiniMap?: boolean;
}

const MAP_STYLES = {
  light: {
    name: "Terang",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  dark: {
    name: "Gelap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  satellite: {
    name: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
};

export default function InteractiveMap({
  places,
  onSelectPlace,
  onPickLocation,
  isPickerMode = false,
  pickedLocation,
  isMiniMap = false,
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [leafletModules, setLeafletModules] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTileStyle, setActiveTileStyle] = useState<keyof typeof MAP_STYLES>("light");
  const [activeSelectedPlace, setActiveSelectedPlace] = useState<PlaceItem | null>(null);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  useEffect(() => {
    setIsClient(true);
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
      import("leaflet.markercluster"),
    ]).then(([L, ReactLeaflet]) => {
      setLeafletModules({ L, ...ReactLeaflet });
    });
  }, []);

  // Extract unique place types
  const placeTypes = useMemo(() => {
    return ["all", ...Array.from(new Set(places.map((p) => p.type)))];
  }, [places]);

  // Filtered places based on category chip selection
  const filteredPlaces = useMemo(() => {
    if (selectedType === "all") return places;
    return places.filter((p) => p.type === selectedType);
  }, [places, selectedType]);

  if (!isClient || !leafletModules) {
    return (
      <div className={`w-full h-full ${isMiniMap ? "min-h-[180px]" : "min-h-[440px]"} rounded-2xl bg-mono-200/50 dark:bg-mono-900/50 animate-pulse flex items-center justify-center font-mono text-xs text-mono-400`}>
        Memuat Peta...
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, useMap, useMapEvents } = leafletModules;

  // Custom Icon for Monochrome Pins with Pulsing Ring
  const createCustomIcon = (type: string, isSelected: boolean) => {
    const bgBg = isSelected ? "#ffffff" : "#18181b";
    const fgFg = isSelected ? "#18181b" : "#ffffff";
    const pulseRing = isSelected
      ? `<div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid #ffffff; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
      : "";

    return L.divIcon({
      className: "custom-map-pin",
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          ${pulseRing}
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${bgBg};
            border: 2.5px solid ${fgFg};
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${fgFg};
            transition: transform 0.2s;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  const pickerIcon = L.divIcon({
    className: "picker-map-pin",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #ef4444;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

  // Map Click Listener
  function LocationPickerListener() {
    useMapEvents({
      click(e: any) {
        if (onPickLocation) {
          onPickLocation(e.latlng.lat, e.latlng.lng);
        }
      },
    });
    return null;
  }


  const gpsUserIcon = L.divIcon({
    className: "user-gps-pin",
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        ">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const handleGetGpsPosition = (mapInstance?: any) => {
    if (!("geolocation" in navigator)) {
      alert("Browser HP Anda tidak mendukung fitur lokasi GPS.");
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserGpsLocation(coords);
        if (onPickLocation) {
          onPickLocation(coords.lat, coords.lng);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        alert(`Gagal mendeteksi lokasi GPS (${err.message}). Pastikan izin diberikan DAN website diakses melalui HTTPS atau localhost.`);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
    );
  };

  // Map Recenter Helper Component
  function MapFlyToCenter({ center }: { center: { lat: number; lng: number } | null }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.flyTo([center.lat, center.lng], 15, { animate: true });
      }
    }, [center, map]);
    return null;
  }

  // Recenter & Fix Leaflet Container Sizing
  function MapResizeFixer({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      const timer = setTimeout(() => {
        map.invalidateSize();
        if (center) {
          map.setView(center, map.getZoom());
        }
      }, 150);
      return () => clearTimeout(timer);
    }, [center, map]);
    return null;
  }

  const defaultCenter: [number, number] =
    filteredPlaces.length > 0
      ? [filteredPlaces[0].latitude, filteredPlaces[0].longitude]
      : [-6.2088, 106.8456];

  return (
    <div className={`w-full h-full ${isMiniMap ? "min-h-[180px]" : "min-h-[460px]"} rounded-3xl overflow-hidden border border-mono-200 dark:border-mono-800 shadow-xl relative group`}>
      {/* Map Control Bar Overlay (Top Floating Category Chips, GPS Button & Style Switcher) */}
      {!isMiniMap && (
        <div className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between pointer-events-none">
          {/* Category Chips */}
          {!isPickerMode && (
            <div className="flex items-center gap-1 bg-white/90 dark:bg-mono-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-lg pointer-events-auto overflow-x-auto max-w-full">
              {placeTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1 rounded-xl font-mono text-[11px] capitalize transition shrink-0 ${
                    selectedType === t
                      ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-bold shadow-sm"
                      : "text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* GPS Button & Style Switcher */}
          <div className="flex items-center gap-2 pointer-events-auto shrink-0 self-end sm:self-auto ml-auto">
            {/* Native GPS Button */}
            <button
              onClick={() => handleGetGpsPosition()}
              disabled={isLocatingGps}
              className="px-3 py-1.5 bg-mono-900/90 dark:bg-mono-100/90 hover:bg-mono-800 backdrop-blur-md text-mono-100 dark:text-mono-900 font-mono text-[10px] font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition disabled:opacity-50"
              title="Dapatkan Posisi GPS Saya saat ini"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocatingGps ? "animate-spin" : ""}`} />
              <span>{isLocatingGps ? "Mencari GPS..." : "GPS Saya"}</span>
            </button>

            {!isPickerMode && (
              <div className="px-3 py-1.5 bg-mono-900/90 dark:bg-mono-100/90 backdrop-blur-md text-mono-100 dark:text-mono-900 font-mono text-[10px] font-bold rounded-xl shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{filteredPlaces.length} Pin</span>
              </div>
            )}

            {/* Tile Switcher */}
            <div className="flex items-center gap-1 bg-white/90 dark:bg-mono-900/90 backdrop-blur-md p-1 rounded-xl border border-mono-200 dark:border-mono-800 shadow-lg">
              {(Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>).map((styleKey) => (
                <button
                  key={styleKey}
                  onClick={() => setActiveTileStyle(styleKey)}
                  className={`px-2 py-1 rounded-lg font-mono text-[10px] font-semibold transition ${
                    activeTileStyle === styleKey
                      ? "bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900"
                      : "text-mono-500 hover:text-mono-900 dark:hover:text-mono-100"
                  }`}
                >
                  {MAP_STYLES[styleKey].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={filteredPlaces.length > 0 ? 12 : 6}
        scrollWheelZoom={!isMiniMap}
        className="w-full h-full z-10"
        style={{ minHeight: isMiniMap ? "180px" : "460px" }}
      >
        <MapResizeFixer center={defaultCenter} />
        <MapFlyToCenter center={userGpsLocation} />

        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={MAP_STYLES[activeTileStyle].url}
          maxZoom={19}
        />

        {isPickerMode && <LocationPickerListener />}

        {/* User GPS Current Location Marker */}
        {userGpsLocation && (
          <Marker position={[userGpsLocation.lat, userGpsLocation.lng]} icon={gpsUserIcon} />
        )}

        {/* Saved Places Markers */}
        {!isPickerMode &&
          filteredPlaces.map((place) => {
            const isSelected = activeSelectedPlace?.id === place.id;
            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={createCustomIcon(place.type, isSelected)}
                eventHandlers={{
                  click: () => {
                    // Open bottom floating card drawer preview on pin click
                    setActiveSelectedPlace(place);
                  },
                }}
              />
            );
          })}

        {/* Picker Mode Pin */}
        {isPickerMode && pickedLocation && (
          <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pickerIcon} />
        )}
      </MapContainer>

      {/* Bottom Floating Card Drawer for Selected Pin */}
      {!isPickerMode && !isMiniMap && activeSelectedPlace && (
        <div className="absolute bottom-4 left-4 right-4 z-30 max-w-sm mx-auto bg-white/95 dark:bg-mono-900/95 backdrop-blur-xl border border-mono-200 dark:border-mono-800 rounded-3xl p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200 flex items-center gap-3">
          {activeSelectedPlace.media && activeSelectedPlace.media.length > 0 ? (
            <img
              src={activeSelectedPlace.media[0].storageUrl}
              alt={activeSelectedPlace.name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-mono-200 dark:border-mono-800"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-mono-200 dark:bg-mono-800 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-mono-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-[9px] uppercase font-bold">
                {activeSelectedPlace.type}
              </span>
              <span className="font-mono text-[10px] text-mono-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(activeSelectedPlace.visitedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            <h4 className="font-bold text-xs truncate text-mono-900 dark:text-mono-100">
              {activeSelectedPlace.name}
            </h4>

            <p className="text-[11px] text-mono-500 dark:text-mono-400 truncate mt-0.5">
              {activeSelectedPlace.notes || "Klik tombol untuk lihat album tempat ini."}
            </p>
          </div>

          <div className="flex flex-col gap-1 items-end shrink-0">
            <button
              onClick={() => setActiveSelectedPlace(null)}
              className="p-1 text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <Link
              href={`/app/album/${activeSelectedPlace.id}`}
              className="px-3 py-1.5 bg-mono-900 hover:bg-mono-800 dark:bg-mono-100 dark:hover:bg-mono-200 text-mono-100 dark:text-mono-900 font-bold text-[11px] rounded-xl flex items-center gap-1 transition shadow"
            >
              <span>Buka Album</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
