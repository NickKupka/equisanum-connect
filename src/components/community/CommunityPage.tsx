import { Plus, Heart, Bookmark, X, Send, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { id: "all", label: "Alle" },
  { id: "general", label: "Allgemein" },
  { id: "question", label: "Fragen" },
  { id: "success", label: "Erfolge" },
  { id: "tip", label: "Tipps" },
  { id: "photo", label: "Fotos" },
];

interface Post {
  id: string;
  user_id: string;
  content: string;
  category: string | null;
  photos: string[];
  is_pinned: boolean;
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `Vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Gestern";
  return `Vor ${days} Tagen`;
}

export function CommunityPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);

  const loadPosts = async () => {
    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("is_hidden", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (activeFilter !== "all") {
      query = query.eq("category", activeFilter);
    }

    const { data: rawPosts } = await query;
    if (!rawPosts || rawPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Load profiles for post authors
    const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p])
    );

    const postsWithProfiles: Post[] = rawPosts.map((p) => ({
      ...p,
      photos: p.photos ?? [],
      profiles: profileMap.get(p.user_id) ?? null,
    }));

    setPosts(postsWithProfiles);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [activeFilter]);

  return (
    <div className="py-5 pb-24">
      <div className="flex items-center justify-between px-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Community
        </h1>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-1.5 rounded-full glass-btn-primary px-4 py-2 text-sm font-medium touch-target transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Beitrag
        </button>
      </div>

      {/* Filter Chips */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors touch-target",
              activeFilter === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-white/10 text-white/60 hover:bg-white/15"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="mt-4 space-y-3 px-4">
        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">Lade Beitraege...</div>
        )}
        {!loading && posts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm text-muted-foreground">Noch keine Beitraege.</p>
            <button
              onClick={() => setShowNewPost(true)}
              className="mt-3 rounded-full glass-btn-primary px-4 py-2 text-sm font-medium"
            >
              Ersten Beitrag schreiben
            </button>
          </div>
        )}
        {posts.map((post) => (
          <CommunityPost key={post.id} post={post} />
        ))}
      </div>

      {showNewPost && user && (
        <ModalPortal>
          <NewPostModal
            userId={user.id}
            onClose={() => setShowNewPost(false)}
            onCreated={() => { setShowNewPost(false); loadPosts(); }}
          />
        </ModalPortal>
      )}
    </div>
  );
}

function CommunityPost({ post }: { post: Post }) {
  const { user } = useAuth();
  const profile = post.profiles;
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Nutzer";
  const initial = displayName[0]?.toUpperCase() || "N";
  const categoryLabel = categories.find((c) => c.id === post.category)?.label ?? post.category ?? "";

  return (
    <div className={cn("card-equi p-4", post.is_pinned && "border-l-4 border-l-primary")}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary">{initial}</span>
          )}
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{displayName}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {post.is_pinned && "📌 Angepinnt · "}
              {timeAgo(post.created_at)}
            </span>
            {categoryLabel && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{categoryLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-foreground whitespace-pre-line">{post.content}</p>
      {post.photos && post.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.photos.map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
      )}
      <PostActions postId={post.id} userId={user?.id ?? ""} />
      <CommentSection postId={post.id} userId={user?.id ?? ""} postAuthorId={post.user_id} />
    </div>
  );
}

function PostActions({ postId, userId }: { postId: string; userId: string }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loadedReaction, setLoadedReaction] = useState(false);

  // Load initial like state and saved state
  useEffect(() => {
    if (!userId || loadedReaction) return;
    // Check if user liked this post
    (async () => {
      const { data: reactions } = await supabase
        .from("community_reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("reaction_type", "heart");
      setLikeCount(reactions?.length ?? 0);
      const userLiked = reactions?.some(() => false); // Need separate check
      const { data: myReaction } = await supabase
        .from("community_reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("reaction_type", "heart")
        .maybeSingle();
      setLiked(!!myReaction);
      setLoadedReaction(true);
    })();
    // Load saved state from localStorage
    const savedPosts: string[] = JSON.parse(localStorage.getItem("equisanum_saved_posts") || "[]");
    setSaved(savedPosts.includes(postId));
  }, [postId, userId, loadedReaction]);

  const toggleLike = async () => {
    if (!userId) return;
    if (liked) {
      // Remove like
      await supabase
        .from("community_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("reaction_type", "heart");
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      // Add like
      await supabase
        .from("community_reactions")
        .insert({ post_id: postId, user_id: userId, reaction_type: "heart" });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const toggleSaved = () => {
    const savedPosts: string[] = JSON.parse(localStorage.getItem("equisanum_saved_posts") || "[]");
    if (saved) {
      const updated = savedPosts.filter((id) => id !== postId);
      localStorage.setItem("equisanum_saved_posts", JSON.stringify(updated));
      setSaved(false);
    } else {
      savedPosts.push(postId);
      localStorage.setItem("equisanum_saved_posts", JSON.stringify(savedPosts));
      setSaved(true);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-4 border-t border-white/10 pt-2">
      <button
        onClick={toggleLike}
        className={cn(
          "flex items-center gap-1 text-xs touch-target transition-colors",
          liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        {likeCount > 0 ? likeCount : ""} {liked ? "Gefällt mir" : "Like"}
      </button>
      <button
        onClick={toggleSaved}
        className={cn(
          "ml-auto flex items-center text-xs touch-target transition-colors",
          saved ? "text-primary" : "text-muted-foreground hover:text-primary"
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      </button>
    </div>
  );
}

function CommentSection({ postId, userId, postAuthorId }: { postId: string; userId: string; postAuthorId: string }) {
  const [comments, setComments] = useState<{ id: string; content: string; created_at: string; profiles: { first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("community_comments")
      .select("id, content, created_at, user_id")
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Load comments error:", error);
      return;
    }
    if (!data || data.length === 0) {
      setComments([]);
      return;
    }
    // Fetch profiles for commenters
    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, first_name, last_name, avatar_url").in("user_id", userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    setComments(data.map((c) => ({ ...c, profiles: profileMap.get(c.user_id) ?? null })));
  }, [postId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handlePost = async () => {
    if (!newComment.trim() || !userId) return;
    setPosting(true);
    try {
      const { data, error } = await supabase.from("community_comments").insert({
        post_id: postId,
        user_id: userId,
        content: newComment.trim(),
      }).select();
      if (error) {
        console.error("Comment insert error:", error);
        toast.error("Kommentar fehlgeschlagen: " + error.message);
      } else {
        console.log("Comment saved:", data);
        // Notify the post author (if not commenting on own post)
        if (postAuthorId && postAuthorId !== userId) {
          await supabase.from("notifications").insert({
            user_id: postAuthorId,
            type: "comment",
            title: "Neuer Kommentar",
            body: newComment.trim().slice(0, 120),
            data: { post_id: postId, comment_id: data?.[0]?.id },
          }).then(({ error: nErr }) => {
            if (nErr) console.error("Notification insert error:", nErr);
          });
        }
        setNewComment("");
        // Small delay to ensure Supabase consistency, then reload
        setTimeout(() => loadComments(), 200);
      }
    } catch (e: any) {
      console.error("Comment exception:", e);
      toast.error("Kommentar fehlgeschlagen: " + (e?.message || String(e)));
    }
    setPosting(false);
  };

  const [showAllComments, setShowAllComments] = useState(false);

  const visibleComments = comments.length > 2 && !showAllComments
    ? [comments[comments.length - 1]]
    : comments;
  const hiddenCount = comments.length > 2 && !showAllComments
    ? comments.length - 1
    : 0;

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAllComments(true)}
          className="text-xs text-primary font-medium hover:underline touch-target"
        >
          {hiddenCount} weitere{hiddenCount === 1 ? "r" : ""} Kommentar{hiddenCount === 1 ? "" : "e"} anzeigen…
        </button>
      )}
      {visibleComments.map((c) => {
        const name = [c.profiles?.first_name, c.profiles?.last_name].filter(Boolean).join(" ") || "Nutzer";
        return (
          <div key={c.id} className="flex gap-2">
            <div className="h-6 w-6 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {c.profiles?.avatar_url
                ? <img src={c.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                : <span className="text-[0.6rem] font-semibold text-white/60">{name[0]}</span>
              }
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground">{name}</span>
              <span className="ml-1.5 text-[0.65rem] text-muted-foreground">{timeAgo(c.created_at)}</span>
              <p className="text-xs text-foreground/80 mt-0.5">{c.content}</p>
            </div>
          </div>
        );
      })}
      <div className="flex gap-2 items-end">
        <input
          className="flex-1 form-input-glass text-xs py-1.5"
          placeholder="Kommentar schreiben..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
        />
        <button
          onClick={handlePost}
          disabled={posting || !newComment.trim()}
          className="flex-shrink-0 rounded-lg glass-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {posting ? "..." : <Send className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function NewPostModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPhotos = [...photos, ...files].slice(0, 4);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);

    const photoUrls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/community/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        photoUrls.push(data.publicUrl);
      }
    }

    await supabase.from("community_posts").insert({
      user_id: userId,
      content: content.trim(),
      category,
      photos: photoUrls,
    });

    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl glass-modal flex flex-col"
        style={{ maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Neuer Beitrag</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 space-y-4 flex-1">
          <div>
            <label className="text-xs font-medium text-white/60">Kategorie</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categories.filter((c) => c.id !== "all").map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    category === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Dein Beitrag</label>
            <textarea
              className="mt-1 form-input-glass resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Was moechtest du teilen?"
              rows={5}
              autoFocus
            />
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 4 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/50 hover:border-white/40 hover:text-white/70 transition-colors"
            >
              <Image className="h-4 w-4" />
              Foto hinzufuegen (max. 4)
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
        </div>

        <div className="px-6 py-4 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving || !content.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl glass-btn-primary py-3 text-sm font-semibold transition-opacity disabled:opacity-50 touch-target"
          >
            <Send className="h-4 w-4" />
            {saving ? "Wird gepostet..." : "Beitrag veroeffentlichen"}
          </button>
        </div>
      </div>
    </div>
  );
}
