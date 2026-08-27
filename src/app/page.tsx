"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Camera,
  MapPin,
  ShieldCheck,
  Compass,
  Globe,
  User,
  Map as MapIcon,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

const InteractiveMap = dynamic(() => import("@/components/map/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-mono-100/50 dark:bg-mono-900/50 backdrop-blur-sm animate-pulse">
      <Compass className="w-8 h-8 text-mono-400 animate-spin" />
    </div>
  ),
});

const SHOWCASE_PUBLIC_PROFILES = [
  {
    username: "putrarawr",
    displayName: "Putra Petualang",
    avatar: "P",
    placesCount: 12,
    topLocation: "Dieng & Jakarta",
    latestImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    bio: "Pencinta alam dan kopi lokal Indonesia.",
  },
  {
    username: "explorer_id",
    displayName: "Arka Nusantari",
    avatar: "A",
    placesCount: 28,
    topLocation: "Borobudur & Jogja",
    latestImage: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80",
    bio: "Menyelusuri warisan budaya nusantara.",
  },
  {
    username: "coffee_notes",
    displayName: "Siti Rahma",
    avatar: "S",
    placesCount: 19,
    topLocation: "Bandung & Jakarta",
    latestImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    bio: "Mencari spot kopi unik dengan desain monokrom.",
  },
];

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
    latitude: -7.2307,
    longitude: 109.9082,
    notes: "Golden sunrise terbaik di Dieng. Hawanya sangat dingin tapi terbayar dengan pemandangannya.",
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
    name: "Kota Tua Jakarta",
    type: "sejarah",
    latitude: -6.1338,
    longitude: 106.8143,
    notes: "Bersepeda ontel keliling museum Fatahillah.",
    visitedAt: "2026-08-01T15:00:00.000Z",
    isPublic: true,
    media: [
      {
        id: "m-3",
        storageUrl: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800&q=80",
        type: "photo",
      },
    ],
  },
];

const features = [
  {
    icon: MapIcon,
    title: "Peta Digital Personal",
    desc: "Setiap lokasi menjadi jejak unik. Pantau sebaran eksplorasi Anda dengan peta interaktif yang memukau.",
  },
  {
    icon: Camera,
    title: "Momen & Memori Visual",
    desc: "Kumpulkan foto dan catatan perjalanan Anda. Tersusun rapi dalam galeri album yang estetik.",
  },
  {
    icon: ShieldCheck,
    title: "Data Milik Anda Sepenuhnya",
    desc: "Disimpan aman di Cloud Supabase, tersinkronisasi di setiap perangkat, dan privat hanya untuk Anda.",
  },
] as const;

export default function LandingPage() {
  const { user, isGuestMode } = useAuth();
  const hasActiveSession = Boolean(user || isGuestMode);
  const supabase = createClient();
  const [places, setPlaces] = useState<any[]>(INITIAL_SAMPLE_PLACES);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    async function fetchUserPlaces() {
      if (user) {
        const { data } = await supabase
          .from("places")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const mapped = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            latitude: row.latitude,
            longitude: row.longitude,
            notes: row.notes,
            visitedAt: row.visited_at,
            isPublic: row.is_public,
            media: row.media_json,
          }));
          setPlaces(mapped);
        }
      }
      setIsMapLoaded(true);
    }

    if (user) {
      fetchUserPlaces();
    } else {
      setTimeout(() => setIsMapLoaded(true), 500);
    }
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 transition-colors duration-500 overflow-x-hidden selection:bg-blue-500/30">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-mono-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full bg-mono-600/10 blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-mono-200/60 dark:border-mono-800/50 bg-white/80 dark:bg-mono-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold tracking-tight text-lg">Jejak.log</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 font-mono text-xs">
            <Link
              href="/app/explore"
              className="text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Jelajah Komunitas</span>
            </Link>
            <Link
              href="/app"
              className="text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors flex items-center gap-1.5"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta & Grid Album</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {hasActiveSession ? (
              <Link
                href="/app"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-mono-900 dark:bg-mono-100 px-5 text-xs font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-0.5 shadow"
              >
                <span>Dashboard Saya</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/app/explore"
                  className="sm:hidden inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold text-mono-700 dark:text-mono-300 border border-mono-200 dark:border-mono-800"
                >
                  Jelajah
                </Link>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-mono-900 dark:bg-mono-100 px-4 sm:px-5 text-xs font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-0.5 shadow"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col z-10">
        {/* Hero Section */}
        <section className="relative mx-auto flex w-full max-w-6xl flex-col lg:flex-row items-center gap-12 px-6 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20">
          {/* Hero Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mono-100 dark:bg-mono-900 border border-mono-200 dark:border-mono-800 font-mono text-[11px] text-mono-600 dark:text-mono-400 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-mono-500" />
                <span>Arsip Personal & Profil Eksplorasi Publik</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight">
                Dokumentasi Singgahan
                <br />
                <em className="text-transparent bg-clip-text bg-gradient-to-r from-mono-500 to-mono-900 dark:from-mono-400 dark:to-mono-100 font-normal italic">
                  Visual & Interaktif
                </em>
              </h1>

              <p className="mt-6 max-w-lg text-sm sm:text-base leading-relaxed text-mono-600 dark:text-mono-400 font-medium">
                Catat setiap tempat yang pernah Anda kunjungi lengkap dengan pin lokasi peta, album foto, video, dan catatan eksplorasi. Bagikan profil publik Anda ke sesama petualang.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link
                  href={hasActiveSession ? "/app" : "/register"}
                  className="group w-full sm:w-auto inline-flex h-13 items-center justify-center gap-3 rounded-2xl bg-mono-900 dark:bg-mono-100 px-8 text-sm font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-1 shadow-lg"
                >
                  <span>{hasActiveSession ? "Lanjutkan Petualangan" : "Mulai Buat Jurnal Peta"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                </Link>

                <Link
                  href="/app/explore"
                  className="group w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2.5 rounded-2xl border border-mono-200 dark:border-mono-800 bg-white/50 dark:bg-mono-900/50 backdrop-blur-sm px-7 text-sm font-bold text-mono-700 dark:text-mono-300 transition-all hover:bg-white dark:hover:bg-mono-900"
                >
                  <Globe className="w-4 h-4" />
                  <span>Jelajah Profil & Komunitas</span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Hero Interactive Map Preview */}
          <div className="w-full lg:w-1/2 h-[420px] sm:h-[500px] relative mt-4 lg:mt-0">
            <Reveal delay={150} className="w-full h-full">
              <div className="w-full h-full p-2 bg-white/40 dark:bg-mono-900/40 backdrop-blur-xl border border-mono-200 dark:border-mono-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-20">
                {/* Safari-like Window Header */}
                <div className="h-10 px-4 flex items-center justify-between border-b border-mono-200 dark:border-mono-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-mono-300 dark:bg-mono-700" />
                    <div className="w-3 h-3 rounded-full bg-mono-300 dark:bg-mono-700" />
                    <div className="w-3 h-3 rounded-full bg-mono-300 dark:bg-mono-700" />
                  </div>
                  <div className="font-mono text-[10px] text-mono-500 font-medium truncate px-4">
                    Preview Peta Digital Jejak.log
                  </div>
                  <Link href="/app/explore" className="font-mono text-[10px] text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 flex items-center gap-1">
                    <span>Eksplorasi</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                {/* Map Container */}
                <div className="flex-1 relative rounded-b-[2.1rem] overflow-hidden bg-mono-100 dark:bg-mono-950">
                  {isMapLoaded && (
                    <div className="absolute inset-0 pointer-events-auto">
                      <InteractiveMap places={places} onSelectPlace={() => {}} />
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Public Explorer Profiles Spoiler Showcase Gallery */}
        <section className="relative mx-auto w-full max-w-6xl px-6 py-16 md:px-8 border-t border-mono-200 dark:border-mono-800/60">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="font-mono text-xs text-mono-400 uppercase tracking-wider block mb-1">
                Komunitas Penjelajah
              </span>
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
                Intip Profil & Galeri Penjelajah
              </h2>
            </div>
            <Link
              href="/app/explore"
              className="px-4 py-2 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-800 dark:text-mono-200 font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition"
            >
              <span>Lihat Semua Komunitas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Cards Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SHOWCASE_PUBLIC_PROFILES.map((profile, i) => (
              <Reveal key={profile.username} delay={i * 100}>
                <div className="group bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-mono-400 transition-all duration-300 flex flex-col h-full">
                  {/* Photo Preview Cover */}
                  <div className="h-44 relative overflow-hidden bg-mono-100 dark:bg-mono-800">
                    <img
                      src={profile.latestImage}
                      alt={profile.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-mono-950/80 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                      {profile.placesCount} Singgahan
                    </div>
                  </div>

                  {/* Profile Info Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold text-sm">
                          {profile.avatar}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-mono-900 dark:text-mono-100 group-hover:text-blue-500 transition-colors">
                            {profile.displayName}
                          </h3>
                          <p className="font-mono text-xs text-mono-400">@{profile.username}</p>
                        </div>
                      </div>
                      <p className="text-xs text-mono-600 dark:text-mono-400 leading-relaxed">
                        {profile.bio}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-mono-100 dark:border-mono-800 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-mono-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {profile.topLocation}
                      </span>

                      <Link
                        href={`/profile/${profile.username}`}
                        className="px-3 py-1.5 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-xl flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition"
                      >
                        <span>Lihat Profil</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative mx-auto w-full max-w-6xl px-6 py-16 md:px-8 border-t border-mono-200 dark:border-mono-800/60">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-3">Didesain untuk Memori Anda</h2>
            <p className="text-mono-500 dark:text-mono-400 font-medium text-xs sm:text-sm max-w-xl mx-auto">
              Singkirkan noise media sosial. Fokus pada pengalaman personal Anda dengan fitur yang dirancang elegan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="h-full rounded-[2rem] border border-mono-200 dark:border-mono-800 bg-white dark:bg-mono-900 p-7 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mono-100 dark:bg-mono-800 text-mono-900 dark:text-mono-100">
                    <f.icon size={22} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-mono-600 dark:text-mono-400 font-medium">
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="relative mx-auto w-full max-w-6xl px-6 pb-20 md:px-8">
          <div className="rounded-[2.5rem] bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 p-10 md:p-14 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
            <Reveal>
              <h2 className="font-serif text-3xl md:text-5xl tracking-tight mb-4 relative z-10">Mulai Jurnal Peta Anda</h2>
              <p className="text-mono-300 dark:text-mono-600 max-w-xl mx-auto mb-8 text-sm sm:text-base relative z-10">
                Satu tempat untuk seluruh jejak penjelajahan Anda di Indonesia dan dunia.
              </p>
              <Link
                href={hasActiveSession ? "/app" : "/register"}
                className="relative z-10 inline-flex h-13 items-center justify-center gap-3 rounded-2xl bg-white dark:bg-mono-900 px-8 text-sm font-bold text-mono-900 dark:text-mono-100 transition-all hover:scale-105 shadow-xl"
              >
                <span>Buka Dashboard Peta</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-mono-200 dark:border-mono-800/60 bg-white dark:bg-mono-900 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="font-mono font-bold text-xs">Jejak.log</span>
          </div>
          <p className="text-[11px] font-mono text-mono-500 text-center">
            &copy; {new Date().getFullYear()} Jejak.log | Album & Profil Eksplorasi Digital
          </p>
        </div>
      </footer>
    </div>
  );
}
