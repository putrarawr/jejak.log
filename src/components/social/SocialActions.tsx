"use client";

import React, { useState, useEffect } from "react";
import { Heart, MessageSquare, Send, Trash2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CommentItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  content: string;
  createdAt: string;
}

interface SocialActionsProps {
  placeId: string;
  isPublic?: boolean;
}

export default function SocialActions({ placeId, isPublic = true }: SocialActionsProps) {
  const { user, isGuestMode } = useAuth();
  const supabase = createClient();

  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  useEffect(() => {
    if (!placeId) return;

    async function loadSocialData() {
      if (!isGuestMode) {
        try {
          // Likes count
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("place_id", placeId);

          if (count !== null) setLikesCount(count);

          // Check if current user liked
          if (user) {
            const { data: userLike } = await supabase
              .from("likes")
              .select("id")
              .eq("place_id", placeId)
              .eq("user_id", user.id)
              .maybeSingle();

            setIsLiked(!!userLike);
          }

          // Fetch comments
          const { data: commentsData } = await supabase
            .from("comments")
            .select("*")
            .eq("place_id", placeId)
            .order("created_at", { ascending: true });

          if (commentsData) {
            const mappedComments: CommentItem[] = commentsData.map((c: any) => ({
              id: c.id,
              userId: c.user_id,
              username: c.username || "explorer",
              displayName: c.display_name || "Petualang",
              content: c.content,
              createdAt: c.created_at,
            }));
            setComments(mappedComments);
          }
        } catch (err) {
          // Fallback to local storage
          loadLocalSocialData();
        }
      } else {
        loadLocalSocialData();
      }
    }

    function loadLocalSocialData() {
      const localLikes = JSON.parse(localStorage.getItem(`jejaklog_likes_${placeId}`) || "[]");
      setLikesCount(localLikes.length);
      if (user) {
        setIsLiked(localLikes.includes(user.id));
      }

      const localComments = JSON.parse(localStorage.getItem(`jejaklog_comments_${placeId}`) || "[]");
      setComments(localComments);
    }

    loadSocialData();
  }, [placeId, user, isGuestMode]);

  const handleToggleLike = async () => {
    if (!user) {
      toast.error("Silakan masuk akun untuk menyukai singgahan ini.");
      return;
    }

    const nextIsLiked = !isLiked;
    const nextCount = nextIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextIsLiked);
    setLikesCount(nextCount);

    if (!isGuestMode) {
      try {
        if (nextIsLiked) {
          await supabase.from("likes").insert([{ place_id: placeId, user_id: user.id }]);
          toast.success("❤️ Disukai!");
        } else {
          await supabase.from("likes").delete().eq("place_id", placeId).eq("user_id", user.id);
        }
      } catch (err) {
        // Fallback local
        handleLocalLike(nextIsLiked);
      }
    } else {
      handleLocalLike(nextIsLiked);
    }
  };

  const handleLocalLike = (liked: boolean) => {
    const localLikes: string[] = JSON.parse(localStorage.getItem(`jejaklog_likes_${placeId}`) || "[]");
    let updatedLikes = [...localLikes];
    if (liked && user) {
      if (!updatedLikes.includes(user.id)) updatedLikes.push(user.id);
      toast.success("❤️ Disukai!");
    } else if (user) {
      updatedLikes = updatedLikes.filter((id) => id !== user.id);
    }
    localStorage.setItem(`jejaklog_likes_${placeId}`, JSON.stringify(updatedLikes));
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    const commentObj: CommentItem = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      username: user.username || "explorer",
      displayName: user.displayName || user.username || "Petualang",
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      if (!isGuestMode) {
        const { data, error } = await supabase
          .from("comments")
          .insert([
            {
              place_id: placeId,
              user_id: user.id,
              username: user.username || "explorer",
              display_name: user.displayName || user.username || "Petualang",
              content: newComment.trim(),
            },
          ])
          .select();

        if (error) {
          handleLocalAddComment(commentObj);
        } else if (data && data.length > 0) {
          const inserted = data[0];
          setComments((prev) => [
            ...prev,
            {
              id: inserted.id,
              userId: inserted.user_id,
              username: inserted.username || user.username || "explorer",
              displayName: inserted.display_name || user.displayName || "Petualang",
              content: inserted.content,
              createdAt: inserted.created_at,
            },
          ]);
        }
      } else {
        handleLocalAddComment(commentObj);
      }

      setNewComment("");
      toast.success("Komentar ditambahkan!");
    } catch (err) {
      handleLocalAddComment(commentObj);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalAddComment = (commentObj: CommentItem) => {
    const updated = [...comments, commentObj];
    setComments(updated);
    localStorage.setItem(`jejaklog_comments_${placeId}`, JSON.stringify(updated));
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (!isGuestMode) {
      try {
        await supabase.from("comments").delete().eq("id", commentId);
      } catch (e) {}
    }
    const localComments: CommentItem[] = JSON.parse(
      localStorage.getItem(`jejaklog_comments_${placeId}`) || "[]"
    );
    const updated = localComments.filter((c) => c.id !== commentId);
    localStorage.setItem(`jejaklog_comments_${placeId}`, JSON.stringify(updated));
    toast.success("Komentar dihapus");
  };

  if (!isPublic) return null;

  return (
    <div className="bg-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition ${
              isLiked
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                : "bg-mono-100 dark:bg-mono-800 text-mono-700 dark:text-mono-300 hover:bg-mono-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{likesCount} Menyukai</span>
          </button>

          {/* Comment Count Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3.5 py-2 bg-mono-100 dark:bg-mono-800 hover:bg-mono-200 text-mono-700 dark:text-mono-300 font-mono text-xs font-bold rounded-2xl transition"
          >
            <MessageSquare className="w-4 h-4 text-mono-400" />
            <span>{comments.length} Komentar</span>
          </button>
        </div>
      </div>

      {/* Comment Section Drawer */}
      {showComments && (
        <div className="space-y-3 pt-3 border-t border-mono-100 dark:border-mono-800 animate-in fade-in duration-150">
          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-xs font-mono text-mono-400 text-center py-3">
              Belum ada komentar. Jadilah yang pertama memberikan kesan!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-mono-50 dark:bg-mono-950 rounded-2xl border border-mono-100 dark:border-mono-800 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs truncate text-mono-900 dark:text-mono-100">
                        {c.displayName}
                      </span>
                      <span className="font-mono text-[10px] text-mono-400">@{c.username}</span>
                    </div>
                    <p className="text-xs text-mono-700 dark:text-mono-300 leading-relaxed">
                      {c.content}
                    </p>
                  </div>

                  {user && user.id === c.userId && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1 text-mono-400 hover:text-red-500 transition"
                      title="Hapus Komentar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar impresi..."
              className="flex-1 px-4 py-2 bg-mono-50 dark:bg-mono-950 border border-mono-200 dark:border-mono-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mono-900 dark:focus:ring-mono-100 transition"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="p-2 bg-mono-900 dark:bg-mono-100 text-mono-100 dark:text-mono-900 rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
