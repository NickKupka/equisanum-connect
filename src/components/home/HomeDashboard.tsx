import {
  BookOpen,
  Plus,
  Calendar,
  Sparkles,
  Eye,
  ChevronRight,
  Megaphone,
  X,
  Send,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function useGreeting(): string {
  const [greeting, setGreeting] = useState("Hallo");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting("Guten Morgen");
    else if (hour < 17) setGreeting("Guten Tag");
    else setGreeting("Guten Abend");
  }, []);
  return greeting;
}

interface RecentEntry {
  id: string;
  date: string;
  type: "training" | "positive" | "changes";
  text: string;
  horse_name: string;
  // Extra detail fields
  activity_type?: string;
  duration_minutes?: number | null;
  user_mood?: string | null;
  horse_mood?: string | null;
  notes?: string | null;
  photos?: string[] | null;
  category?: string | null;
  photo_url?: string | null;
  body_area?: string | null;
  severity?: string | null;
}

export function HomeDashboard() {
  const { profile, user } = useAuth();
  const greeting = useGreeting();
  const displayName = profile?.first_name || "dort";
  const navigate = useNavigate();

  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [detailEntry, setDetailEntry] = useState<RecentEntry | null>(null);
  const [newsPosts, setNewsPosts] = useState<{ id: string; title: string; content: string; image_url: string | null; created_at: string }[]>([]);
  const [newsReactions, setNewsReactions] = useState<{ id: string; news_id: string; user_id: string; emoji: string }[]>([]);
  const [replyNewsId, setReplyNewsId] = useState<string | null>(null);

  const loadRecent = useCallback(async () => {
    if (!user) return;
    setLoadingEntries(true);

    // Load horse names
    const { data: horseData } = await supabase
      .from("horses")
      .select("id,name")
      .eq("owner_id", user.id)
      .eq("archived", false);
    const horseMap = Object.fromEntries(
      ((horseData as { id: string; name: string }[]) ?? []).map((h) => [h.id, h.name])
    );

    const [diary, positive, changes] = await Promise.all([
      supabase
        .from("diary_entries")
        .select("id,date,content,activity_type,duration_minutes,user_mood,horse_mood,notes,photos,horse_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("positive_entries")
        .select("id,date,content,category,photo_url,horse_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("change_entries")
        .select("id,date,content,body_area,category,severity,photos,horse_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5),
    ]);

    const entries: RecentEntry[] = [
      ...((diary.data ?? []) as any[]).map((e: any) => ({
        id: e.id,
        date: e.date,
        type: "training" as const,
        text: e.content || e.activity_type,
        horse_name: horseMap[e.horse_id] ?? "",
        activity_type: e.activity_type,
        duration_minutes: e.duration_minutes,
        user_mood: e.user_mood,
        horse_mood: e.horse_mood,
        notes: e.notes,
        photos: e.photos,
      })),
      ...((positive.data ?? []) as any[]).map((e: any) => ({
        id: e.id,
        date: e.date,
        type: "positive" as const,
        text: e.content,
        horse_name: horseMap[e.horse_id] ?? "",
        category: e.category,
        photo_url: e.photo_url,
      })),
      ...((changes.data ?? []) as any[]).map((e: any) => ({
        id: e.id,
        date: e.date,
        type: "changes" as const,
        text: e.content,
        horse_name: horseMap[e.horse_id] ?? "",
        category: e.category,
        body_area: e.body_area,
        severity: e.severity,
        photos: e.photos,
      })),
    ];

    entries.sort((a, b) => b.date.localeCompare(a.date));
    setRecentEntries(entries.slice(0, 6));
    setLoadingEntries(false);
  }, [user]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Load news
  const loadNews = useCallback(async () => {
    const [postsRes, reactionsRes] = await Promise.all([
      supabase.from("news_posts").select("id,title,content,image_url,created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(10),
      supabase.from("news_reactions").select("id,news_id,user_id,emoji"),
    ]);
    setNewsPosts((postsRes.data as typeof newsPosts) ?? []);
    setNewsReactions((reactionsRes.data as typeof newsReactions) ?? []);
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const toggleReaction = async (newsId: string, emoji: string) => {
    if (!user) return;
    const existing = newsReactions.find((r) => r.news_id === newsId && r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from("news_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("news_reactions").insert({ news_id: newsId, user_id: user.id, emoji });
    }
    loadNews();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Vor ${mins} Min.`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Vor ${hrs} Std.`;
    const days = Math.floor(hrs / 24);
    return `Vor ${days} Tag${days !== 1 ? "en" : ""}`;
  };

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {greeting}, {displayName}!
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Schön, dass du da bist.
        </p>
      </div>

      {/* News / Announcements from Laura */}
      {newsPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-accent" />
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Neuigkeiten
            </h2>
          </div>
          <div className="space-y-3">
            {newsPosts.map((post) => {
              const reactions = newsReactions.filter((r) => r.news_id === post.id);
              const emojiCounts = reactions.reduce<Record<string, { count: number; mine: boolean }>>((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
                acc[r.emoji].count++;
                if (r.user_id === user?.id) acc[r.emoji].mine = true;
                return acc;
              }, {});
              return (
                <div key={post.id} className="card-equi border-l-4 border-l-accent p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary-foreground">L</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Laura</span>
                      <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">EquiSanum</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{post.title}</h3>
                  {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-lg max-h-48 object-cover" />}
                  <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>

                  {/* Reactions + Reply */}
                  <div className="flex items-center gap-2 pt-1">
                    {["👍", "❤️", "🎉", "💪"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(post.id, emoji)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors",
                          emojiCounts[emoji]?.mine ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60 hover:bg-white/20",
                        )}
                      >
                        {emoji} {emojiCounts[emoji]?.count || ""}
                      </button>
                    ))}
                    <button onClick={() => setReplyNewsId(post.id)} className="ml-auto flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60 hover:bg-white/20 transition-colors">
                      <Send className="h-3 w-3" /> Nachricht
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => navigate({ to: "/journal", search: { tab: "training", add: true } })}
            className="flex flex-col items-center gap-2 rounded-xl p-4 touch-target transition-all active:scale-95 bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium leading-tight text-center">Training</span>
          </button>
          <button
            onClick={() => navigate({ to: "/journal", search: { tab: "positive", add: true } })}
            className="flex flex-col items-center gap-2 rounded-xl p-4 touch-target transition-all active:scale-95 bg-accent text-accent-foreground shadow-sm"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-medium leading-tight text-center">Positiv</span>
          </button>
          <button
            onClick={() => navigate({ to: "/journal", search: { tab: "changes", add: true } })}
            className="flex flex-col items-center gap-2 rounded-xl p-4 touch-target transition-all active:scale-95 bg-primary text-primary-foreground shadow-sm"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs font-medium leading-tight text-center">Veränderung</span>
          </button>
          <button
            onClick={() => navigate({ to: "/journal", search: { calendar: true } })}
            className="flex flex-col items-center gap-2 rounded-xl p-4 touch-target transition-all active:scale-95 bg-accent text-accent-foreground shadow-sm"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium leading-tight text-center">Kalender</span>
          </button>
        </div>
      </div>

      {/* Recent Diary Entries */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Letzte Tagebucheinträge
          </h2>
          <Link to="/journal" className="text-xs font-medium text-primary">
            Alle <ChevronRight className="inline h-3 w-3" />
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {loadingEntries && (
            <div className="py-6 flex justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {!loadingEntries && recentEntries.length === 0 && (
            <div className="card-equi p-4 text-center">
              <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
              <Link to="/journal" className="mt-2 inline-block text-sm font-medium text-primary">
                Ersten Eintrag erstellen <ChevronRight className="inline h-3 w-3" />
              </Link>
            </div>
          )}
          {recentEntries.map((entry) => (
            <RecentEntryCard key={entry.id} entry={entry} onSelect={setDetailEntry} />
          ))}
        </div>
      </div>

      {/* Nützliche Tipps */}
      <div>
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Nützliche Tipps
        </h2>
        <TipOfTheDay />
      </div>

      {/* Entry Detail Modal */}
      {detailEntry && (
        <HomeEntryDetail entry={detailEntry} onClose={() => setDetailEntry(null)} />
      )}

      {/* News Reply Modal */}
      {replyNewsId && user && (
        <NewsReplyModal
          newsId={replyNewsId}
          userId={user.id}
          newsTitle={newsPosts.find((p) => p.id === replyNewsId)?.title ?? ""}
          onClose={() => setReplyNewsId(null)}
          onSent={() => setReplyNewsId(null)}
        />
      )}
    </div>
  );
}

const TIPS = [
  "Hast du heute die Hufe deines Pferdes angeschaut?",
  "Beobachte beim nächsten Training, ob dein Pferd gleichmäßig auf beiden Händen läuft.",
  "Ein kurzer Spaziergang kann manchmal wertvoller sein als eine Trainingseinheit.",
  "Achte auf die Ohrenstellung – sie verrät viel über die Stimmung deines Pferdes.",
  "Hast du in letzter Zeit die Zähne deines Pferdes kontrollieren lassen?",
  "Dokumentiere kleine Fortschritte – sie summieren sich zu großen Veränderungen!",
  "Gönn deinem Pferd ab und zu einen Ruhetag – Regeneration ist wichtig.",
  "Massiere die Beine deines Pferdes nach dem Training – das fördert die Durchblutung.",
  "Wie ist der Fellzustand? Glänzendes Fell zeigt Wohlbefinden an.",
  "Beobachte das Fressverhalten – Veränderungen können ein Hinweis auf Probleme sein.",
];

function TipOfTheDay() {
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  return (
    <div className="card-linen p-4">
      <p className="text-sm text-muted-foreground italic">
        💡 "{tip}"
      </p>
      <Link to="/journal" className="mt-2 inline-block text-sm font-medium text-primary">
        Jetzt notieren →
      </Link>
    </div>
  );
}

function RecentEntryCard({ entry, onSelect }: { entry: RecentEntry; onSelect: (e: RecentEntry) => void }) {
  const typeConfig = {
    training: { emoji: "📓", label: "Training", bgClass: "card-equi" },
    positive: { emoji: "✨", label: "Positiv", bgClass: "card-gold" },
    changes: { emoji: "👁️", label: "Veränderung", bgClass: "card-equi" },
  };
  const config = typeConfig[entry.type];

  const fmtDate = (d: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return "Heute";
    if (d === yesterday) return "Gestern";
    return new Date(d + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

  return (
    <button
      onClick={() => onSelect(entry)}
      className={cn("rounded-lg p-3 transition-all w-full text-left active:scale-[0.98]", config.bgClass)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{config.emoji}</span>
          <span className="font-medium text-foreground">{entry.horse_name || config.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{fmtDate(entry.date)}</span>
      </div>
      <p className="mt-1 text-sm text-foreground line-clamp-1">{entry.text}</p>
    </button>
  );
}

/* ── Mood / Severity label maps ── */
const MOODS_MAP: Record<string, string> = {
  great: "😄 Super",
  good: "🙂 Gut",
  okay: "😐 Okay",
  bad: "😟 Nicht so gut",
};
const SEVERITY_MAP: Record<string, string> = {
  low: "🟡 Gering",
  medium: "🟠 Mittel",
  high: "🔴 Hoch",
};

/* ── Detail Sheet (opens via createPortal) ── */
function HomeEntryDetail({ entry, onClose }: { entry: RecentEntry; onClose: () => void }) {
  const typeLabels = {
    training: "📓 " + (entry.activity_type || "Training"),
    positive: "✨ " + (entry.category || "Positiv"),
    changes: "👁️ " + (entry.category || "Veränderung"),
  };
  const title = typeLabels[entry.type];
  const dateStr = new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const photos: string[] = [];
  if (entry.photos?.length) photos.push(...entry.photos);
  if (entry.photo_url) photos.push(entry.photo_url);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div
        className="glass-modal relative w-full max-w-md rounded-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        style={{ maxHeight: "90dvh" }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 min-w-0">
          <h2 className="font-heading text-lg font-bold text-white truncate pr-2">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target flex-shrink-0">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 pb-5 space-y-4 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">{dateStr}</span>
            {entry.horse_name && (
              <span className="text-xs font-medium text-white/60">🐎 {entry.horse_name}</span>
            )}
          </div>

          {/* Training detail */}
          {entry.type === "training" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {entry.activity_type && (
                  <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                    {entry.activity_type}
                  </span>
                )}
                {entry.duration_minutes && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                    ⏱ {entry.duration_minutes} Min.
                  </span>
                )}
                {entry.user_mood && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                    {MOODS_MAP[entry.user_mood] ?? entry.user_mood}
                  </span>
                )}
                {entry.horse_mood && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                    🐎 {MOODS_MAP[entry.horse_mood] ?? entry.horse_mood}
                  </span>
                )}
              </div>
              {entry.text && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/50 mb-1">Beschreibung</p>
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>{entry.text}</p>
                </div>
              )}
              {entry.notes && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/50 mb-1">Notizen</p>
                  <p className="text-sm italic text-white/70 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>{entry.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Positive detail */}
          {entry.type === "positive" && (
            <div className="space-y-3">
              {entry.category && (
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                  {entry.category}
                </span>
              )}
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>{entry.text}</p>
            </div>
          )}

          {/* Changes detail */}
          {entry.type === "changes" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {entry.category && (
                  <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-300">
                    {entry.category}
                  </span>
                )}
                {entry.severity && (
                  <span className="inline-flex items-center rounded-full bg-warning/20 px-2.5 py-1 text-xs font-medium text-warning">
                    {SEVERITY_MAP[entry.severity] ?? entry.severity}
                  </span>
                )}
              </div>
              {entry.body_area && (
                <div>
                  <p className="text-xs font-medium text-white/50 mb-1">Bereich</p>
                  <p className="text-sm text-white/90">{entry.body_area}</p>
                </div>
              )}
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>{entry.text}</p>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/50 mb-2">Fotos</p>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full rounded-xl object-cover max-h-48" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── News Reply Modal ── */
function NewsReplyModal({
  newsId,
  userId,
  newsTitle,
  onClose,
  onSent,
}: {
  newsId: string;
  userId: string;
  newsTitle: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    const { error } = await supabase.from("news_messages").insert({
      news_id: newsId,
      user_id: userId,
      content: msg.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Nachricht konnte nicht gesendet werden");
      return;
    }
    toast.success("Nachricht an Laura gesendet 💌");
    onSent();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a2e] p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-white">Nachricht zu &quot;{newsTitle}&quot;</h3>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#c28f5a]"
          rows={4}
          placeholder="Schreibe Laura eine Nachricht…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white">
            Abbrechen
          </button>
          <button
            onClick={send}
            disabled={sending || !msg.trim()}
            className="rounded-xl bg-[#c28f5a] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {sending ? "Sende…" : "Senden"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}