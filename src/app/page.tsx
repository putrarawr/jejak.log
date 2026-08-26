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
  Sparkles,
  Map as MapIcon
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
  )
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
    name: "Bukit Sikunir",
    type: "alam",
    latitude: -7.2307,
    longitude: 109.9082,
    notes: "Golden sunrise terbaik di Dieng. Hawanya sangat dingin tapi terbayar dengan pemandangannya.",
    visitedAt: "2026-08-15T05:30:00.000Z",
    isPublic: true,
    media: [
      {
        id: "m-2",
        storageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
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
        const { data, error } = await supabase
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark:border-mono-800/50 bg-white/70 dark:bg-mono-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-mono-800 to-mono-950 dark:from-mono-100 dark:to-mono-300 text-mono-100 dark:text-mono-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold tracking-tight text-lg">Jejak.log</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {hasActiveSession ? (
              <Link
                href="/app"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-mono-900 dark:bg-mono-100 px-5 text-xs font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-md"
              >
                <span>Dashboard Saya</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors hover:bg-mono-100 dark:hover:bg-mono-900"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-mono-900 dark:bg-mono-100 px-5 text-xs font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-md"
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col z-10">
        {/* Hero Section */}
        <section className="relative mx-auto flex w-full max-w-6xl flex-col lg:flex-row items-center gap-12 px-6 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
          
          {/* Hero Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <Reveal>

              <h1 className="font-serif text-5xl leading-[1.1] tracking-tight sm:text-6xl md:text-[4.5rem]">
                Sudah ke mana saja,
                <br />
                <em className="text-transparent bg-clip-text bg-gradient-to-r from-mono-500 to-mono-900 dark:from-mono-400 dark:to-mono-100 font-normal italic">
                  tercatat rapi.
                </em>
              </h1>
              
              <p className="mt-8 max-w-lg text-base sm:text-lg leading-relaxed text-mono-600 dark:text-mono-400 font-medium">
                Jejak.log adalah ruang eksklusif untuk mendokumentasikan tempat-tempat yang pernah Anda kunjungi. Saksikan jejak petualangan Anda terpetakan dengan visual yang memukau.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href={hasActiveSession ? "/app" : "/register"}
                  className="group w-full sm:w-auto inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-mono-900 dark:bg-mono-100 px-8 text-sm font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)]"
                >
                  <span>{hasActiveSession ? "Lanjutkan Petualangan" : "Mulai Mencatat Singgahan"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                </Link>
                
                {!hasActiveSession && (
                  <Link
                    href="/login"
                    className="group w-full sm:w-auto inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl border border-mono-200 dark:border-mono-800 bg-white/50 dark:bg-mono-900/50 backdrop-blur-sm px-8 text-sm font-bold text-mono-700 dark:text-mono-300 transition-all hover:bg-white dark:hover:bg-mono-900 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Coba Mode Demo</span>
                  </Link>
                )}
              </div>
            </Reveal>
          </div>

          {/* Hero Interactive Map (Glassmorphism Wrapper) */}
          <div className="w-full lg:w-1/2 h-[450px] sm:h-[550px] relative mt-8 lg:mt-0">
            <Reveal delay={150} className="w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 rounded-[2.5rem] blur-2xl -z-10" />
              <div className="w-full h-full p-2 bg-white/40 dark:bg-mono-900/40 backdrop-blur-xl border border-white/50 dark:border-mono-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-20">
                {/* Safari-like Window Header */}
                <div className="h-10 px-4 flex items-center gap-2 border-b border-mono-200/50 dark:border-mono-800/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="flex-1 text-center font-mono text-[10px] text-mono-500 font-medium truncate px-4">
                    {hasActiveSession ? `Peta Sinkron: ${user?.displayName || "Jejak Anda"}` : "Live Preview: Peta Jejak.log"}
                  </div>
                </div>
                {/* Map Container */}
                <div className="flex-1 relative rounded-b-[2.1rem] overflow-hidden bg-mono-100/50 dark:bg-mono-950/50 pointer-events-none">
                  {isMapLoaded && (
                    <div className="absolute inset-0 pointer-events-auto">
                      <InteractiveMap places={places} onSelectPlace={() => {}} />
                    </div>
                  )}
                  {/* Glass Overlay to make it feel like a preview if not logged in */}
                  {!hasActiveSession && (
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-mono-950 to-transparent pointer-events-none z-[400] flex items-end justify-center pb-6">
                      <span className="px-4 py-1.5 bg-mono-900/80 dark:bg-mono-100/80 backdrop-blur-md text-white dark:text-black font-mono text-[10px] rounded-full shadow-lg">
                        Data Sampel (Login untuk sinkronisasi)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative mx-auto w-full max-w-6xl px-6 pb-24 md:px-8 md:pb-32 mt-10">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-4">Didesain untuk Memori Anda</h2>
            <p className="text-mono-500 dark:text-mono-400 font-medium max-w-xl mx-auto">
              Singkirkan noise media sosial. Fokus pada pengalaman personal Anda dengan fitur yang dirancang elegan.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="group h-full rounded-[2rem] border border-mono-200 dark:border-mono-800 bg-white dark:bg-mono-900 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <f.icon className="w-32 h-32 transform rotate-12" />
                  </div>
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 shadow-inner">
                    <f.icon size={24} />
                  </div>
                  <h3 className="font-bold text-xl mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-mono-600 dark:text-mono-400 font-medium">
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative mx-auto w-full max-w-6xl px-6 pb-24 md:px-8 md:pb-32">
          <div className="rounded-[2.5rem] bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 p-10 md:p-16 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] dark:[background-image:radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
            <Reveal>
              <h2 className="font-serif text-3xl md:text-5xl tracking-tight mb-6 relative z-10">Mulai Arsip Pertama Anda</h2>
              <p className="text-mono-300 dark:text-mono-600 max-w-2xl mx-auto mb-10 text-lg relative z-10">
                Lupakan cara lama menyimpan memori yang tercecer di berbagai aplikasi. 
                Satu tempat untuk seluruh jejak penjelajahan Anda.
              </p>
              <Link
                href={hasActiveSession ? "/app" : "/register"}
                className="relative z-10 inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white dark:bg-mono-900 px-10 text-sm font-bold text-mono-900 dark:text-mono-100 transition-all hover:scale-105 shadow-2xl"
              >
                <span>Buka Peta Sekarang</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-mono-200 dark:border-mono-800/60 bg-white dark:bg-mono-900 z-10 py-10 mt-auto">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-8">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <Compass className="w-5 h-5" />
            <span className="font-mono font-bold text-sm">Jejak.log</span>
          </div>
          <p className="text-xs font-medium text-mono-500 text-center">
            &copy; {new Date().getFullYear()} Jejak.log. Dibuat dengan arsitektur modern & Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
}
