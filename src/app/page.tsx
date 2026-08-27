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
  const [places, setPlaces] = useState<any[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user places if logged in
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

        // Fetch real public profiles from database
        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .limit(6);

        if (usersData && usersData.length > 0) {
          setPublicProfiles(usersData);
        } else {
          setPublicProfiles([]);
        }
      } catch (e) {
        setPublicProfiles([]);
      } finally {
        setIsMapLoaded(true);
      }
    }

    fetchData();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-mono-50 dark:bg-mono-950 text-mono-900 dark:text-mono-100 transition-colors duration-500 overflow-x-hidden selection:bg-blue-500/30">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-mono-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full bg-mono-600/10 blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-mono-200/60 dark:border-mono-800/50 bg-white/80 dark:bg-mono-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold tracking-tight text-lg">Jejak.log</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 font-mono text-xs">
            <Link
              href="/app/explore"
              className="text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Jelajah Komunitas</span>
            </Link>
            <Link
              href="/app"
              className="text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta & Grid Album</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <ThemeToggle />
            {hasActiveSession ? (
              <Link
                href="/app"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-mono-900 dark:bg-mono-100 px-4 sm:px-5 text-xs font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-0.5 shadow shrink-0 whitespace-nowrap min-h-[40px]"
              >
                <span>Dashboard Saya</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Link
                  href="/app/explore"
                  className="sm:hidden inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-bold text-mono-700 dark:text-mono-300 border border-mono-200 dark:border-mono-800 shrink-0 whitespace-nowrap min-h-[40px]"
                >
                  Jelajah
                </Link>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold text-mono-600 dark:text-mono-400 hover:text-mono-900 dark:hover:text-mono-100 transition-colors shrink-0 whitespace-nowrap min-h-[40px]"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-mono-900 dark:bg-mono-100 px-4 sm:px-5 text-xs font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-0.5 shadow shrink-0 whitespace-nowrap min-h-[40px]"
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
                  className="group w-full sm:w-auto inline-flex h-13 min-h-[48px] items-center justify-center gap-3 rounded-2xl bg-mono-900 dark:bg-mono-100 px-8 text-sm font-bold text-mono-100 dark:text-mono-900 transition-all hover:-translate-y-1 shadow-lg shrink-0 whitespace-nowrap"
                >
                  <span>{hasActiveSession ? "Lanjutkan Petualangan" : "Mulai Buat Jurnal Peta"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                </Link>

                <Link
                  href="/app/explore"
                  className="group w-full sm:w-auto inline-flex h-13 min-h-[48px] items-center justify-center gap-2.5 rounded-2xl border border-mono-200 dark:border-mono-800 bg-white/50 dark:bg-mono-900/50 backdrop-blur-sm px-7 text-sm font-bold text-mono-700 dark:text-mono-300 transition-all hover:bg-white dark:hover:bg-mono-900 shrink-0 whitespace-nowrap"
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
              <div className="w-full h-full rounded-[2.5rem] border border-mono-200 dark:border-mono-800 bg-mono-100 dark:bg-mono-950 shadow-2xl overflow-hidden relative z-20">
                {isMapLoaded && (
                  <div className="absolute inset-0 pointer-events-auto">
                    <InteractiveMap places={places} />
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Real Public Profiles Section (ONLY rendered if profiles exist in Database) */}
        {publicProfiles.length > 0 && (
          <section className="relative mx-auto w-full max-w-6xl px-6 py-16 md:px-8 border-t border-mono-200 dark:border-mono-800/60">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="font-mono text-xs text-mono-400 uppercase tracking-wider block mb-1">
                  Komunitas Penjelajah
                </span>
                <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
                  Profil Penjelajah Publik
                </h2>
              </div>
              <Link
                href="/app/explore"
                className="px-4 py-2.5 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 dark:hover:bg-mono-700 text-mono-800 dark:text-mono-200 font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition shrink-0 whitespace-nowrap min-h-[40px]"
              >
                <span>Lihat Semua Komunitas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Cards Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publicProfiles.map((userRow, i) => (
                <Reveal key={userRow.id || i} delay={i * 100}>
                  <div className="group bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 flex items-center justify-center font-bold text-base shadow shrink-0">
                          {userRow.display_name ? userRow.display_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-base text-mono-900 dark:text-mono-100 truncate">
                            {userRow.display_name || userRow.username}
                          </h3>
                          <p className="font-mono text-xs text-mono-400 truncate">@{userRow.username}</p>
                        </div>
                      </div>

                      <p className="text-xs text-mono-600 dark:text-mono-400 leading-relaxed line-clamp-2">
                        {userRow.bio || "Penjelajah Jejak.log | Arsip tempat dan peta eksplorasi personal."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-mono-100 dark:border-mono-800 flex justify-end">
                      <Link
                        href={`/profile/${userRow.username}`}
                        className="px-4 py-2 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-blue-600 group-hover:text-white transition shrink-0 whitespace-nowrap min-h-[38px]"
                      >
                        <span>Buka Profil</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}

              {/* Call-to-Action Cards if grid has less than 3 profiles */}
              {publicProfiles.length > 0 && publicProfiles.length < 3 && Array.from({ length: 3 - publicProfiles.length }).map((_, i) => (
                <Reveal key={`cta-${i}`} delay={(publicProfiles.length + i) * 100}>
                  <Link
                    href="/register"
                    className="group bg-mono-50 dark:bg-mono-950 border-2 border-dashed border-mono-200 dark:border-mono-800 rounded-3xl p-6 flex flex-col items-center justify-center h-full text-center space-y-4 hover:border-mono-900 dark:hover:border-mono-100 hover:bg-mono-100 dark:hover:bg-mono-900 transition-all duration-300 min-h-[220px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-mono-200 dark:bg-mono-800 text-mono-400 group-hover:text-mono-900 dark:group-hover:text-mono-100 flex items-center justify-center transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-mono-900 dark:text-mono-100">Jadilah Bagian dari Kami</h3>
                      <p className="text-xs text-mono-500 dark:text-mono-400 mt-1">Daftar sekarang dan bagikan eksplorasimu.</p>
                    </div>
                    <span className="px-4 py-2 bg-white dark:bg-mono-950 border border-mono-200 dark:border-mono-800 text-mono-900 dark:text-mono-100 font-mono text-xs font-bold rounded-xl mt-2 transition shadow-sm group-hover:shadow">
                      Mulai Sekarang
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}

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
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mono-100 dark:bg-mono-800 text-mono-900 dark:text-mono-100 shrink-0">
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
                className="relative z-10 inline-flex h-13 min-h-[48px] items-center justify-center gap-3 rounded-2xl bg-white dark:bg-mono-900 px-8 text-sm font-bold text-mono-900 dark:text-mono-100 transition-all hover:scale-105 shadow-xl shrink-0 whitespace-nowrap"
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
          <div className="flex items-center gap-2 shrink-0">
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
