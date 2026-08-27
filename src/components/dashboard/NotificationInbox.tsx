"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: "like" | "comment";
  placeId: string;
  placeName: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  content?: string;
  createdAt: string;
}

export default function NotificationInbox() {
  const { user, isGuestMode } = useAuth();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || isGuestMode) return;

    let isMounted = true;
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const { data: places } = await supabase
          .from("places")
          .select("id, name")
          .eq("user_id", user!.id);

        if (!places || places.length === 0) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const placeMap = new Map(places.map((p: any) => [p.id, p.name]));
        const placeIds = places.map((p: any) => p.id);

        const { data: comments } = await supabase
          .from("comments")
          .select("*")
          .in("place_id", placeIds)
          .neq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const { data: likes } = await supabase
          .from("likes")
          .select("*")
          .in("place_id", placeIds)
          .neq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const notifs: NotificationItem[] = [];

        if (comments) {
          comments.forEach((c: any) => {
            notifs.push({
              id: `c-${c.id}`,
              type: "comment",
              placeId: c.place_id,
              placeName: placeMap.get(c.place_id) || "Singgahan",
              actorId: c.user_id,
              actorUsername: c.username || "explorer",
              actorDisplayName: c.display_name || "Petualang",
              content: c.content,
              createdAt: c.created_at,
            });
          });
        }

        if (likes && likes.length > 0) {
          const actorIds = Array.from(new Set(likes.map((l: any) => l.user_id)));
          const { data: actors } = await supabase
            .from("users")
            .select("id, username, display_name")
            .in("id", actorIds);
            
          const actorMap = new Map();
          if (actors) {
            actors.forEach((a: any) => {
              actorMap.set(a.id, a);
            });
          }

          likes.forEach((l: any) => {
            const actor = actorMap.get(l.user_id) || {};
            notifs.push({
              id: `l-${l.id}`,
              type: "like",
              placeId: l.place_id,
              placeName: placeMap.get(l.place_id) || "Singgahan",
              actorId: l.user_id,
              actorUsername: actor.username || "explorer",
              actorDisplayName: actor.display_name || "Petualang",
              createdAt: l.created_at,
            });
          });
        }

        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const recentNotifs = notifs.slice(0, 20);

        if (isMounted) {
          setNotifications(recentNotifs);
          setUnreadCount(recentNotifs.length > 0 ? recentNotifs.length : 0);
        }
      } catch (err) {
        console.warn("Failed to fetch notifications", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchNotifications();
    
    return () => { isMounted = false; };
  }, [user, isGuestMode]);

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  if (!user || isGuestMode) return null;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        className="w-10 h-10 rounded-full flex items-center justify-center text-mono-600 dark:text-mono-400 hover:bg-mono-100 dark:hover:bg-mono-800 transition relative"
        title="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-mono-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[320px] sm:w-[400px] bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          <div className="px-4 py-3 border-b border-mono-100 dark:border-mono-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">Notifikasi</h3>
            {notifications.length > 0 && (
              <span className="text-[10px] font-mono bg-mono-100 dark:bg-mono-800 px-2 py-0.5 rounded-full text-mono-500">
                {notifications.length} Baru
              </span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-xs font-mono text-mono-400">
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-mono-400">
                Belum ada aktivitas baru.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={`/app/album/${notif.placeId}`}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 hover:bg-mono-50 dark:hover:bg-mono-800/50 transition flex gap-3 border-b border-mono-50 dark:border-mono-800/30 last:border-0"
                  >
                    <div className="shrink-0 mt-0.5">
                      {notif.type === "like" ? (
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                          <Heart className="w-4 h-4 fill-current" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <MessageSquare className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-mono-900 dark:text-mono-100 leading-snug">
                        <span className="font-bold">{notif.actorDisplayName}</span>{" "}
                        {notif.type === "like" ? "menyukai" : "mengomentari"}{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {notif.placeName}
                        </span>
                      </p>
                      {notif.type === "comment" && notif.content && (
                        <p className="text-xs text-mono-500 mt-1 line-clamp-1 italic">
                          "{notif.content}"
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-mono-400 mt-1.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: localeId })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
