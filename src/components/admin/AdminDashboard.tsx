import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, ChevronLeft, ChevronDown, ChevronRight, MessageSquare,
  Camera, X, Save, Search, ShieldAlert, BookOpen, Sparkles, Eye, FileText, Megaphone, Pencil, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const ADMIN_EMAILS = ["laura.schnaku@gmail.com", "laura.kupka@gmail.com", "info@equisanum.de", "laura13@online.de"];

const REHA_CATEGORIES = ["Allgemein", "Training", "Therapie", "Analyse", "Pflege"];
const MOOD_OPTIONS = [
  { value: "great", emoji: "\u{1F604}" },
  { value: "good", emoji: "\u{1F642}" },
  { value: "okay", emoji: "\u{1F610}" },
  { value: "bad", emoji: "\u{1F615}" },
  { value: "poor", emoji: "\u{1F623}" },
];

interface Profile {
  id: string; user_id: string; first_name: string | null; last_name: string | null;
  email: string | null; avatar_url: string | null;
}

interface AdminHorse {
  id: string; name: string; breed: string | null; photo_url: string | null;
  owner_id: string; reha_status: string; reha_start_date: string | null;
  reha_end_date: string | null; share_diary: boolean; share_positive: boolean;
  share_changes: boolean;
}

interface RehaEntry {
  id: string; horse_id: string; created_by: string | null; date: string;
  title: string | null; content: string; category: string | null;
  mood: string | null; photos: string[] | null; created_at: string;
}

interface FeedbackMessage {
  id: string; user_id: string; horse_id: string | null; title: string;
  content: string; is_read: boolean; created_at: string;
}

interface DashboardStats {
  users: number; horses: number; rehaActive: number; communityPosts: number;
  diaryEntries: number; positiveEntries: number; changeEntries: number;
}

interface SharedEntry {
  id: string; date: string; content: string; type: "diary" | "positive" | "change";
  category?: string | null; photos?: string[] | null; mood?: string | null;
  severity?: string | null; body_area?: string | null;
  activity_type?: string | null; duration_minutes?: number | null;
}

type View = "main" | "users" | "horse" | "news";

// ---- Main Component ----

export function AdminDashboard() {
  const { user, profile: authProfile } = useAuth();
  const userEmail = user?.email ?? authProfile?.email ?? "";
  if (userEmail && !ADMIN_EMAILS.includes(userEmail)) {
    return <AccessDenied />;
  }
  return <AdminContent userId={user?.id ?? ""} />;
}

function AccessDenied() {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4">
      <div className="w-full max-w-sm rounded-2xl glass-modal p-6 text-center space-y-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="font-heading text-lg font-bold text-white">WARNUNG</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Das ist ein geschützter Admin-Bereich.<br />
          <span className="font-semibold text-red-400">Du bist kein Admin – du darfst hier nicht hin.</span>
        </p>
        <a href="/" className="mt-2 inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
          Zurück zur Startseite
        </a>
      </div>
    </div>,
    document.body,
  );
}

function AdminContent({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("main");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [horses, setHorses] = useState<AdminHorse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<AdminHorse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, horsesRes, postsRes, diaryRes, positiveRes, changeRes] = await Promise.all([
      supabase.from("profiles").select("id,user_id,first_name,last_name,email,avatar_url"),
      supabase.from("horses").select("id,name,breed,photo_url,owner_id,reha_status,reha_start_date,reha_end_date,share_diary,share_positive,share_changes").eq("archived", false),
      supabase.from("community_posts").select("id", { count: "exact", head: true }),
      supabase.from("diary_entries").select("id", { count: "exact", head: true }),
      supabase.from("positive_entries").select("id", { count: "exact", head: true }),
      supabase.from("change_entries").select("id", { count: "exact", head: true }),
    ]);
    const profilesList = (profilesRes.data as Profile[]) ?? [];
    const horsesList = (horsesRes.data as AdminHorse[]) ?? [];
    setProfiles(profilesList);
    setHorses(horsesList);
    setSelectedHorse((prev) => prev ? horsesList.find((h) => h.id === prev.id) ?? null : null);
    setStats({
      users: profilesList.length,
      horses: horsesList.length,
      rehaActive: horsesList.filter((h) => h.reha_status === "active").length,
      communityPosts: postsRes.count ?? 0,
      diaryEntries: diaryRes.count ?? 0,
      positiveEntries: positiveRes.count ?? 0,
      changeEntries: changeRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openHorse = (horse: AdminHorse) => { setSelectedHorse(horse); setView("horse"); };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {view === "main" && <MainView profiles={profiles} horses={horses} stats={stats!} onShowUsers={() => setView("users")} onShowNews={() => setView("news")} onOpenHorse={openHorse} />}
      {view === "users" && <UsersView profiles={profiles} horses={horses} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onBack={() => setView("main")} onOpenHorse={openHorse} />}
      {view === "horse" && selectedHorse && <AdminHorseView horse={selectedHorse} ownerProfile={profiles.find((p) => p.user_id === selectedHorse.owner_id) ?? null} userId={userId} onBack={() => setView("users")} onRefresh={loadData} />}
      {view === "news" && <NewsView userId={userId} profiles={profiles} onBack={() => setView("main")} />}
    </div>
  );
}

// ---- MainView ----

function MainView({ profiles, horses, stats, onShowUsers, onShowNews, onOpenHorse }: {
  profiles: Profile[]; horses: AdminHorse[]; stats: DashboardStats;
  onShowUsers: () => void; onShowNews: () => void; onOpenHorse: (h: AdminHorse) => void;
}) {
  const rehaActive = horses.filter((h) => h.reha_status === "active");
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-white">Admin-Bereich</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={stats.users} label="Nutzer" icon={<Users className="h-4 w-4" />} color="text-primary" />
        <StatCard value={stats.horses} label="Pferde" icon={<span className="text-sm">🐴</span>} color="text-primary" />
        <StatCard value={stats.rehaActive} label="Aktive Reha" icon={<span className="text-sm">🩺</span>} color="text-reha" />
        <StatCard value={stats.communityPosts} label="Community Posts" icon={<FileText className="h-4 w-4" />} color="text-primary" />
        <StatCard value={stats.diaryEntries} label="Trainingseintr." icon={<BookOpen className="h-4 w-4" />} color="text-primary" />
        <StatCard value={stats.positiveEntries} label="Positive Eintr." icon={<Sparkles className="h-4 w-4" />} color="text-primary" />
        <StatCard value={stats.changeEntries} label="Veraenderungen" icon={<Eye className="h-4 w-4" />} color="text-primary" />
        <button onClick={onShowUsers} className="card-equi p-4 text-center hover:ring-1 hover:ring-primary/50 transition-all">
          <Users className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-1 text-xs text-muted-foreground">Alle Nutzer</p>
        </button>
        <button onClick={onShowNews} className="card-equi p-4 text-center hover:ring-1 hover:ring-accent/50 transition-all">
          <Megaphone className="mx-auto h-6 w-6 text-accent" />
          <p className="mt-1 text-xs text-muted-foreground">Neuigkeiten</p>
        </button>
      </div>
      {rehaActive.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/80">Aktive Reha-Pferde</h3>
          {rehaActive.map((h) => (
            <button key={h.id} onClick={() => onOpenHorse(h)} className="w-full card-equi p-3 flex items-center gap-3 hover:ring-1 hover:ring-reha/50 transition-all text-left">
              {h.photo_url ? <img src={h.photo_url} alt={h.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg">🐴</div>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{h.name}</p>
                <p className="text-xs text-reha">Reha seit {h.reha_start_date ? new Date(h.reha_start_date).toLocaleDateString("de-DE") : "–"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
      <FeedbackInbox profiles={profiles} horses={horses} />
    </div>
  );
}

function StatCard({ value, label, icon, color }: { value: number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card-equi p-4 text-center">
      <div className={cn("flex items-center justify-center gap-1.5 mb-1", color)}>
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ---- UsersView ----

function UsersView({ profiles, horses, searchQuery, setSearchQuery, onBack, onOpenHorse }: {
  profiles: Profile[]; horses: AdminHorse[]; searchQuery: string;
  setSearchQuery: (q: string) => void; onBack: () => void; onOpenHorse: (h: AdminHorse) => void;
}) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const filtered = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.first_name?.toLowerCase().includes(q)) || (p.last_name?.toLowerCase().includes(q)) || (p.email?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-white/10"><ChevronLeft className="h-5 w-5 text-white" /></button>
        <h2 className="font-heading text-lg font-bold text-white">Alle Nutzer</h2>
        <span className="ml-auto text-xs text-muted-foreground">{profiles.length}</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="form-input-glass pl-9 text-sm" placeholder="Nutzer suchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.map((p) => {
          const userHorses = horses.filter((h) => h.owner_id === p.user_id);
          const isExpanded = expandedUser === p.user_id;
          return (
            <div key={p.id} className="card-equi overflow-hidden">
              <button onClick={() => setExpandedUser(isExpanded ? null : p.user_id)} className="w-full flex items-center gap-3 p-3 text-left">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{(p.first_name?.[0] ?? "?").toUpperCase()}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.first_name ?? ""} {p.last_name ?? ""}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email ?? "–"}</p>
                </div>
                <span className="text-xs text-muted-foreground">{userHorses.length} 🐴</span>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-2">
                  {userHorses.length === 0 ? <p className="text-xs text-muted-foreground py-2 text-center">Keine Pferde</p> : userHorses.map((h) => (
                    <button key={h.id} onClick={() => onOpenHorse(h)} className="w-full flex items-center gap-2.5 rounded-lg bg-white/5 p-2.5 hover:bg-white/10 transition-colors text-left">
                      {h.photo_url ? <img src={h.photo_url} alt={h.name} className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-sm">🐴</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.breed ?? "–"}</p>
                      </div>
                      {h.reha_status === "active" && <span className="text-xs font-medium text-reha bg-reha/10 px-2 py-0.5 rounded-full">Reha</span>}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- AdminHorseView ----

function AdminHorseView({ horse, ownerProfile, userId, onBack, onRefresh }: {
  horse: AdminHorse; ownerProfile: Profile | null; userId: string;
  onBack: () => void; onRefresh: () => void;
}) {
  const [rehaStatus, setRehaStatus] = useState(horse.reha_status);
  const [toggling, setToggling] = useState(false);
  const [entries, setEntries] = useState<RehaEntry[]>([]);
  const [sharedEntries, setSharedEntries] = useState<SharedEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reha" | "shared">("reha");

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data: rehaData } = await supabase.from("reha_updates").select("*").eq("horse_id", horse.id).order("date", { ascending: false });
    setEntries((rehaData as RehaEntry[]) ?? []);
    const shared: SharedEntry[] = [];
    if (horse.share_diary) {
      const { data } = await supabase.from("diary_entries").select("id,date,content,notes,activity_type,duration_minutes,photos,user_mood,horse_mood").eq("horse_id", horse.id).order("date", { ascending: false }).limit(30);
      (data ?? []).forEach((d: any) => shared.push({ id: d.id, date: d.date, content: d.notes || d.content || "", type: "diary", photos: d.photos, mood: d.horse_mood || d.user_mood, activity_type: d.activity_type, duration_minutes: d.duration_minutes }));
    }
    if (horse.share_positive) {
      const { data } = await supabase.from("positive_entries").select("id,date,content,category,photo_url").eq("horse_id", horse.id).order("date", { ascending: false }).limit(30);
      (data ?? []).forEach((d: any) => shared.push({ id: d.id, date: d.date, content: d.content, type: "positive", category: d.category, photos: d.photo_url ? [d.photo_url] : null }));
    }
    if (horse.share_changes) {
      const { data } = await supabase.from("change_entries").select("id,date,content,category,severity,body_area,photos").eq("horse_id", horse.id).order("date", { ascending: false }).limit(30);
      (data ?? []).forEach((d: any) => shared.push({ id: d.id, date: d.date, content: d.content, type: "change", category: d.category, severity: d.severity, body_area: d.body_area, photos: d.photos }));
    }
    shared.sort((a, b) => b.date.localeCompare(a.date));
    setSharedEntries(shared);
    setLoadingEntries(false);
  }, [horse.id, horse.share_diary, horse.share_positive, horse.share_changes]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const toggleReha = async () => {
    setToggling(true);
    const newStatus = rehaStatus === "active" ? "none" as const : "active" as const;
    if (newStatus === "active") {
      await supabase.from("horses").update({ reha_status: newStatus, reha_start_date: new Date().toISOString().slice(0, 10), reha_end_date: null }).eq("id", horse.id);
    } else {
      await supabase.from("horses").update({ reha_status: newStatus, reha_end_date: new Date().toISOString().slice(0, 10) }).eq("id", horse.id);
    }
    setRehaStatus(newStatus);
    onRefresh();
    setToggling(false);
  };

  const hasSharedContent = horse.share_diary || horse.share_positive || horse.share_changes;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-white/10"><ChevronLeft className="h-5 w-5 text-white" /></button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {horse.photo_url ? <img src={horse.photo_url} alt={horse.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg">🐴</div>}
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-white truncate">{horse.name}</h2>
            <p className="text-xs text-muted-foreground">Besitzer: {ownerProfile ? `${ownerProfile.first_name ?? ""} ${ownerProfile.last_name ?? ""}`.trim() || ownerProfile.email : "–"}</p>
          </div>
        </div>
      </div>
      <div className="card-equi p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Reha-Status</p>
            <p className="text-xs text-muted-foreground">{rehaStatus === "active" ? `Aktiv seit ${horse.reha_start_date ? new Date(horse.reha_start_date).toLocaleDateString("de-DE") : "–"}` : "Keine aktive Reha"}</p>
          </div>
          <button onClick={toggleReha} disabled={toggling} className={cn("relative h-7 w-12 rounded-full transition-colors", rehaStatus === "active" ? "bg-reha" : "bg-white/20", toggling && "opacity-50")}>
            <span className={cn("absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", rehaStatus === "active" && "translate-x-5")} />
          </button>
        </div>
      </div>
      <div className="card-equi p-3">
        <p className="text-xs font-semibold text-white/60 mb-1.5">Nutzer-Freigaben</p>
        <div className="flex flex-wrap gap-2">
          <ShareBadge label="Training" active={horse.share_diary} />
          <ShareBadge label="Positiv" active={horse.share_positive} />
          <ShareBadge label="Veraenderungen" active={horse.share_changes} />
        </div>
      </div>
      {hasSharedContent && (
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("reha")} className={cn("flex-1 rounded-full py-2 text-xs font-semibold transition-colors", activeTab === "reha" ? "bg-reha text-white" : "bg-white/10 text-white/60")}>🩺 Reha ({entries.length})</button>
          <button onClick={() => setActiveTab("shared")} className={cn("flex-1 rounded-full py-2 text-xs font-semibold transition-colors", activeTab === "shared" ? "bg-primary text-white" : "bg-white/10 text-white/60")}>📋 Nutzer ({sharedEntries.length})</button>
        </div>
      )}
      {rehaStatus === "active" && activeTab === "reha" && (
        <button onClick={() => setAddOpen(true)} className="w-full flex items-center justify-center gap-2 rounded-full bg-reha py-3 text-sm font-semibold text-white">+ Neuer Reha-Eintrag</button>
      )}
      {loadingEntries ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : activeTab === "reha" ? (
        entries.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">Noch keine Reha-Eintraege</p> : (
          <div className="relative space-y-3 pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
            {entries.map((e) => <AdminRehaEntryCard key={e.id} entry={e} />)}
          </div>
        )
      ) : sharedEntries.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">Keine freigegebenen Eintraege</p>
      ) : (
        <div className="space-y-2">{sharedEntries.map((e) => <SharedEntryCard key={e.id} entry={e} />)}</div>
      )}
      {addOpen && <AddRehaEntryModal horseId={horse.id} userId={userId} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); loadEntries(); }} />}
    </div>
  );
}

function ShareBadge({ label, active }: { label: string; active: boolean }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", active ? "bg-primary/20 text-primary" : "bg-white/5 text-white/30")}>{active ? "✓" : "✗"} {label}</span>;
}

function SharedEntryCard({ entry }: { entry: SharedEntry }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = entry.type === "diary" ? "📓 Training" : entry.type === "positive" ? "✨ Positiv" : "👁️ Veraenderung";
  const typeColor = entry.type === "diary" ? "text-blue-400" : entry.type === "positive" ? "text-yellow-400" : "text-orange-400";
  return (
    <button onClick={() => setExpanded(!expanded)} className="w-full card-equi p-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", typeColor)}>{typeLabel}</span>
          {entry.category && <span className="text-xs text-muted-foreground">· {entry.category}</span>}
        </div>
        <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
      </div>
      {entry.activity_type && <p className="mt-1 text-xs text-white/50">{entry.activity_type}{entry.duration_minutes ? ` · ${entry.duration_minutes} Min.` : ""}</p>}
      {entry.severity && <p className="mt-1 text-xs text-white/50">Schwere: {entry.severity}{entry.body_area ? ` · ${entry.body_area}` : ""}</p>}
      <p className={cn("mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words", !expanded && "line-clamp-2")} style={{ overflowWrap: "anywhere" }}>{entry.content}</p>
      {expanded && entry.photos && entry.photos.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">{entry.photos.map((url, i) => <img key={i} src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />)}</div>
      )}
    </button>
  );
}

function AdminRehaEntryCard({ entry }: { entry: RehaEntry }) {
  const [expanded, setExpanded] = useState(false);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="relative">
      <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-reha bg-card" />
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left card-equi p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{formatDate(entry.date)}</span>
          <div className="flex items-center gap-1.5">
            {entry.category && <span className="text-xs text-muted-foreground">{entry.category}</span>}
            {entry.mood && <span>{MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji ?? entry.mood}</span>}
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>
        {entry.title && <h4 className="mt-1 text-sm font-semibold text-foreground">{entry.title}</h4>}
        <p className={cn("mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words", !expanded && "line-clamp-2")} style={{ overflowWrap: "anywhere" }}>{entry.content}</p>
        {expanded && entry.photos && entry.photos.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">{entry.photos.map((url, i) => <img key={i} src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />)}</div>
        )}
      </button>
    </div>
  );
}

// ---- AddRehaEntryModal ----

function AddRehaEntryModal({ horseId, userId, onClose, onSaved }: { horseId: string; userId: string; onClose: () => void; onSaved: () => void; }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Allgemein");
  const [mood, setMood] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photos.length + files.length > 4) return;
    setPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `reha/${horseId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, file);
        if (!error) { const { data } = supabase.storage.from("media").getPublicUrl(path); photoUrls.push(data.publicUrl); }
      }
      const { error } = await supabase.from("reha_updates").insert({
        horse_id: horseId, created_by: userId, date,
        title: title.trim() || null, content: content.trim(),
        category, mood: mood || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
      });
      if (error) { toast.error("Speichern fehlgeschlagen: " + error.message); }
      else { onSaved(); }
    } catch (e) { console.error("Save exception:", e); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl glass-modal flex flex-col animate-in slide-in-from-bottom-4 duration-300" style={{ maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Neuer Reha-Eintrag</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <div>
            <label className="text-xs font-medium text-white/60">Datum</label>
            <input type="date" className="mt-1 form-input-glass" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Kategorie</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {REHA_CATEGORIES.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors", category === cat ? "bg-reha text-white" : "bg-white/10 text-white/70 hover:bg-white/20")}>{cat}</button>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Stimmung</label>
            <div className="mt-1.5 flex gap-2">
              {MOOD_OPTIONS.map((m) => <button key={m.value} onClick={() => setMood(mood === m.value ? "" : m.value)} className={cn("text-2xl p-1 rounded-lg transition-all", mood === m.value ? "bg-white/20 scale-110" : "opacity-60 hover:opacity-100")}>{m.emoji}</button>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Titel (optional)</label>
            <input className="mt-1 form-input-glass" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Tag 14 - Fortschritte" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Beschreibung *</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Wie geht es dem Pferd? Was wurde gemacht?" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Fotos (max. 4)</label>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"><X className="h-3 w-3 text-white" /></button>
                </div>
              ))}
              {photos.length < 4 && <button onClick={() => fileRef.current?.click()} className="h-16 w-16 rounded-lg border border-dashed border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"><Camera className="h-5 w-5 text-white/50" /></button>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex-shrink-0">
          <button onClick={handleSave} disabled={saving || !content.trim()} className="w-full flex items-center justify-center gap-2 rounded-full bg-reha py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Eintrag speichern
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---- FeedbackInbox ----

function FeedbackInbox({ profiles, horses }: { profiles: Profile[]; horses: AdminHorse[] }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("feedback_messages").select("*").order("created_at", { ascending: false }).limit(50);
      setMessages((data as FeedbackMessage[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const openMsg = (msg: FeedbackMessage) => {
    if (!msg.is_read) {
      supabase.from("feedback_messages").update({ is_read: true }).eq("id", msg.id).then();
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
    setSelectedMsg(msg);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const getProfile = (uid: string) => profiles.find((p) => p.user_id === uid);
  const getHorse = (hid: string | null) => (hid ? horses.find((h) => h.id === hid) : null);

  if (loading) return null;
  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-white/80">Nachrichten</h3>
        {unreadCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{unreadCount}</span>}
      </div>
      {messages.map((msg) => {
        const p = getProfile(msg.user_id);
        const h = getHorse(msg.horse_id);
        const userName = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Unbekannt" : "Unbekannt";
        return (
          <button key={msg.id} onClick={() => openMsg(msg)} className={cn("w-full card-equi p-3 text-left transition-all", !msg.is_read && "ring-1 ring-primary/30")}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground truncate flex-1">{msg.title}</p>
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{new Date(msg.created_at).toLocaleDateString("de-DE")}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" /> : <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{(p?.first_name?.[0] ?? "?").toUpperCase()}</div>}
              <span className="text-xs text-white/60 truncate">{userName}</span>
              {h && <span className="text-xs text-white/40">· 🐴 {h.name}</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{msg.content}</p>
            {!msg.is_read && <span className="mt-1 inline-block text-xs font-medium text-primary">Neu</span>}
          </button>
        );
      })}
      {selectedMsg && <MessageDetailModal msg={selectedMsg} profile={getProfile(selectedMsg.user_id) ?? null} horse={getHorse(selectedMsg.horse_id) ?? null} onClose={() => setSelectedMsg(null)} />}
    </div>
  );
}

// ---- MessageDetailModal ----

function MessageDetailModal({ msg, profile, horse, onClose }: { msg: FeedbackMessage; profile: Profile | null; horse: AdminHorse | null; onClose: () => void; }) {
  const userName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.email || "Unbekannt" : "Unbekannt";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center glass-overlay" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl glass-modal flex flex-col animate-in slide-in-from-bottom-4 duration-300" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg font-bold text-white truncate">{msg.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" /> : <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{(profile?.first_name?.[0] ?? "?").toUpperCase()}</div>}
              <span className="text-xs text-white/60">{userName}</span>
              {profile?.email && <span className="text-xs text-white/40 truncate">· {profile.email}</span>}
            </div>
            {horse && <p className="text-xs text-white/40 mt-0.5">🐴 {horse.name}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 flex-shrink-0 ml-2"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">
          <p className="text-xs text-muted-foreground mb-3">{new Date(msg.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>{msg.content}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---- NewsView ----

interface NewsPost {
  id: string; title: string; content: string; image_url: string | null;
  is_active: boolean; created_at: string; author_id: string;
}

interface NewsMsg {
  id: string; news_id: string; user_id: string; content: string;
  is_read: boolean; created_at: string;
}

interface NewsReaction {
  id: string; news_id: string; user_id: string; emoji: string;
}

function NewsView({ userId, profiles, onBack }: { userId: string; profiles: Profile[]; onBack: () => void }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [messages, setMessages] = useState<NewsMsg[]>([]);
  const [reactions, setReactions] = useState<NewsReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedMsgs, setExpandedMsgs] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const [postsRes, msgsRes, reactRes] = await Promise.all([
      supabase.from("news_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("news_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("news_reactions").select("*"),
    ]);
    setPosts((postsRes.data as NewsPost[]) ?? []);
    setMessages((msgsRes.data as NewsMsg[]) ?? []);
    setReactions((reactRes.data as NewsReaction[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const toggleActive = async (post: NewsPost) => {
    await supabase.from("news_posts").update({ is_active: !post.is_active }).eq("id", post.id);
    loadPosts();
  };

  const deletePost = async (id: string) => {
    await supabase.from("news_posts").delete().eq("id", id);
    loadPosts();
  };

  const markMsgRead = async (id: string) => {
    await supabase.from("news_messages").update({ is_read: true }).eq("id", id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  const getProfile = (uid: string) => profiles.find((p) => p.user_id === uid);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-white/10"><ChevronLeft className="h-5 w-5 text-white" /></button>
        <Megaphone className="h-5 w-5 text-accent" />
        <h2 className="font-heading text-lg font-bold text-white">Neuigkeiten</h2>
        <span className="ml-auto text-xs text-muted-foreground">{posts.length}</span>
      </div>

      <button onClick={() => { setEditingPost(null); setCreating(true); }} className="w-full flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground">
        + Neue Neuigkeit
      </button>

      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : posts.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">Noch keine Neuigkeiten</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const postMsgs = messages.filter((m) => m.news_id === post.id);
            const postReactions = reactions.filter((r) => r.news_id === post.id);
            const unread = postMsgs.filter((m) => !m.is_read).length;
            const isExpanded = expandedMsgs === post.id;
            // Group reactions by emoji with count
            const emojiCounts: Record<string, number> = {};
            postReactions.forEach((r) => { emojiCounts[r.emoji] = (emojiCounts[r.emoji] ?? 0) + 1; });
            return (
              <div key={post.id} className={cn("card-equi overflow-hidden", !post.is_active && "opacity-60")}>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString("de-DE")}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleActive(post)} className="p-1.5 rounded-full hover:bg-white/10" title={post.is_active ? "Deaktivieren" : "Aktivieren"}>
                        {post.is_active ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4 text-white/40" />}
                      </button>
                      <button onClick={() => { setEditingPost(post); setCreating(true); }} className="p-1.5 rounded-full hover:bg-white/10"><Pencil className="h-3.5 w-3.5 text-white/60" /></button>
                      <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-full hover:bg-white/10"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                    </div>
                  </div>
                  {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-lg max-h-40 object-cover" />}
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                  {Object.keys(emojiCounts).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.entries(emojiCounts).map(([emoji, count]) => (
                        <span key={emoji} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                          <span>{emoji}</span>
                          <span className="text-white/70">{count}</span>
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{postReactions.length} Reaktion{postReactions.length !== 1 ? "en" : ""}</span>
                    </div>
                  )}
                  {postMsgs.length > 0 && (
                    <button onClick={() => setExpandedMsgs(isExpanded ? null : post.id)} className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {postMsgs.length} Nachricht{postMsgs.length !== 1 ? "en" : ""}
                      {unread > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}
                    </button>
                  )}
                </div>
                {isExpanded && postMsgs.length > 0 && (
                  <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-2">
                    {postMsgs.map((m) => {
                      const p = getProfile(m.user_id);
                      const name = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Unbekannt" : "Unbekannt";
                      return (
                        <div key={m.id} className={cn("rounded-lg bg-white/5 p-2.5", !m.is_read && "ring-1 ring-primary/30")} onClick={() => !m.is_read && markMsgRead(m.id)}>
                          <div className="flex items-center gap-2">
                            {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" /> : <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{(p?.first_name?.[0] ?? "?").toUpperCase()}</div>}
                            <span className="text-xs font-medium text-white/80">{name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleDateString("de-DE")}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>{m.content}</p>
                          {!m.is_read && <span className="text-xs text-primary font-medium">Neu</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating && <EditNewsModal userId={userId} post={editingPost} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); loadPosts(); }} />}
    </div>
  );
}

function EditNewsModal({ userId, post, onClose, onSaved }: { userId: string; post: NewsPost | null; onClose: () => void; onSaved: () => void; }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(post?.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      let finalImageUrl = post?.image_url ?? null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("news").upload(path, imageFile);
        if (upErr) {
          console.error("Upload error:", upErr);
          toast.error("Bild-Upload fehlgeschlagen: " + upErr.message);
        } else {
          const { data } = supabase.storage.from("news").getPublicUrl(path);
          finalImageUrl = data.publicUrl;
        }
      }
      if (!imagePreview) finalImageUrl = null;
      if (post) {
        const { error } = await supabase.from("news_posts").update({ title: title.trim(), content: content.trim(), image_url: finalImageUrl, updated_at: new Date().toISOString() }).eq("id", post.id);
        if (error) toast.error("Fehler: " + error.message); else onSaved();
      } else {
        const { error } = await supabase.from("news_posts").insert({ author_id: userId, title: title.trim(), content: content.trim(), image_url: finalImageUrl });
        if (error) toast.error("Fehler: " + error.message); else onSaved();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl glass-modal flex flex-col animate-in slide-in-from-bottom-4 duration-300" style={{ maxHeight: "90dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">{post ? "Neuigkeit bearbeiten" : "Neue Neuigkeit"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <div>
            <label className="text-xs font-medium text-white/60">Titel *</label>
            <input className="mt-1 form-input-glass" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Neue Rehaplätze frei" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Inhalt *</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Was gibt es Neues?" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Bild (optional)</label>
            <div className="mt-1.5">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="" className="w-full rounded-lg max-h-40 object-cover" />
                  <button onClick={() => { setImageFile(null); setImagePreview(""); }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center"><X className="h-3.5 w-3.5 text-white" /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full h-20 rounded-lg border border-dashed border-white/30 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                  <Camera className="h-5 w-5 text-white/50" /><span className="text-xs text-white/50">Bild hinzufügen</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-3 flex-shrink-0">
          <button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()} className="w-full flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            {post ? "Speichern" : "Veröffentlichen"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
