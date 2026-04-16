import {
  Plus,
  ChevronRight,
  Phone,
  Camera,
  ClipboardList,
  Pencil,
  X,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearch } from "@tanstack/react-router";
import { toast } from "sonner";

// Renders children in document.body to escape any overflow/transform ancestors
function ModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4">
      {children}
    </div>,
    document.body,
  );
}

const horseTabs = [
  { id: "overview", label: "Übersicht", emoji: "📋" },
  { id: "reha", label: "Reha", emoji: "🏥" },
  { id: "diary", label: "Tagebuch", emoji: "📓" },
  { id: "positive", label: "Positiv", emoji: "✨" },
  { id: "changes", label: "Veränderungen", emoji: "👁️" },
] as const;

type HorseTab = (typeof horseTabs)[number]["id"];

interface Horse {
  id: string;
  name: string;
  breed?: string | null;
  nickname?: string | null;
  gender?: string | null;
  color?: string | null;
  height_cm?: number | null;
  history?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  reha_status: string;
  share_diary?: boolean;
  share_positive?: boolean;
  share_changes?: boolean;
  vet_name?: string | null;
  vet_phone?: string | null;
  farrier_name?: string | null;
  farrier_phone?: string | null;
}

export function HorsePage() {
  const { user } = useAuth();
  const { selected: selectedHorseId } = useSearch({ from: "/horse" }) as { selected?: string };
  const initialSelectionRef = useRef(selectedHorseId);
  const [activeTab, setActiveTab] = useState<HorseTab>("overview");
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const loadHorses = useCallback(async () => {
    if (!user) return;
    if (horses.length === 0) setLoading(true);
    const { data } = await supabase
      .from("horses")
      .select("*")
      .eq("owner_id", user.id)
      .eq("archived", false);
    const list = (data as Horse[]) ?? [];
    setHorses(list);
    // If a horse was requested via URL param (only on initial load), select it
    const initialId = initialSelectionRef.current;
    setSelectedHorse((prev) => {
      if (initialId) {
        const requested = list.find((h) => h.id === initialId);
        if (requested) {
          initialSelectionRef.current = undefined; // only use once
          return requested;
        }
      }
      const stillExists = prev && list.find((h) => h.id === prev.id);
      return stillExists ? (list.find((h) => h.id === prev.id) ?? list[0] ?? null) : (list[0] ?? null);
    });
    setLoading(false);
  }, [user]);

  // Load on mount and whenever the window regains focus (e.g. after adding a horse in Profile)
  // BUT: skip reload while editOpen or uploading to avoid killing the edit sheet
  // when the user picks a photo (file picker steals focus on mobile)
  useEffect(() => {
    loadHorses();
    const onFocus = () => {
      if (!editOpen) loadHorses();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadHorses, editOpen]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (horses.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🐴</span>
        <h2 className="font-heading text-xl font-bold text-foreground">Noch kein Pferd</h2>
        <p className="text-sm text-muted-foreground">Füge dein erstes Pferd über das Profil hinzu.</p>
      </div>
    );
  }

  const horse = selectedHorse!;
  const rehaStatusLabel = horse.reha_status === "active" ? "In Reha" : horse.reha_status === "completed" ? "Abgeschlossen" : "Aktiv";

  return (
    <div className="py-5">
      {/* Horse selector if multiple */}
      {horses.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto px-4">
          {horses.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHorse(h)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all touch-target",
                selectedHorse?.id === h.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              🐴 {h.name}
            </button>
          ))}
        </div>
      )}

      {/* Horse Header */}
      <div className="px-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-linen">
            {horse.photo_url
              ? <img src={horse.photo_url} alt={horse.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-4xl">🐴</div>
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">{horse.name}</h1>
              {horse.reha_status === "active" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-reha/10 px-2 py-0.5 text-xs font-medium text-reha">
                  🔵 {rehaStatusLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {[horse.breed, horse.gender === "mare" ? "Stute" : horse.gender === "gelding" ? "Wallach" : horse.gender === "stallion" ? "Hengst" : horse.gender, horse.color].filter(Boolean).join(" · ") || "Keine weiteren Angaben"}
            </p>
            {horse.nickname && <p className="text-xs text-muted-foreground">Rufname: {horse.nickname}</p>}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full border border-border hover:bg-muted transition-colors touch-target"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Tab Bar - wrapping */}
      <div className="mt-4 flex flex-wrap gap-1.5 px-4 pb-3 border-b border-white/10">
        {horseTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all touch-target",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4 px-4 pb-24">
        {activeTab === "overview" && <HorseOverview horse={horse} onRefresh={loadHorses} />}
        {activeTab === "reha" && <HorseReha horseId={horse.id} rehaStatus={horse.reha_status} rehaStartDate={(horse as any).reha_start_date} />}
        {activeTab === "diary" && <HorseDiaryTab horseId={horse.id} horseName={horse.name} userId={user!.id} />}
        {activeTab === "positive" && <HorsePositiveTab horseId={horse.id} horseName={horse.name} userId={user!.id} />}
        {activeTab === "changes" && <HorseChangesTab horseId={horse.id} horseName={horse.name} userId={user!.id} />}
      </div>

      {editOpen && (
        <EditHorseSheet
          horse={horse}
          userId={user!.id}
          onClose={() => setEditOpen(false)}
          onSaved={() => { loadHorses(); setEditOpen(false); }}
          onDeleted={() => { setEditOpen(false); setSelectedHorse(null); loadHorses(); }}
        />
      )}
    </div>
  );
}

function HorseOverview({ horse, onRefresh }: { horse: Horse; onRefresh: () => void }) {
  const { user } = useAuth();
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const loadGallery = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.storage.from("media").list(`${user.id}/${horse.id}/gallery`, { limit: 50 });
    if (data && data.length > 0) {
      const urls = data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
          const { data: urlData } = supabase.storage.from("media").getPublicUrl(`${user.id}/${horse.id}/gallery/${f.name}`);
          return `${urlData.publicUrl}?t=${f.updated_at}`;
        });
      setGalleryPhotos(urls);
    } else {
      setGalleryPhotos([]);
    }
  }, [user, horse.id]);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      console.warn("Gallery upload: no file or no user", { file: !!file, user: !!user });
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast.error("Bild zu groß – max. 10 MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${user.id}/${horse.id}/gallery/${fileName}`;
      console.log("Gallery upload: starting", { path, bucket: "media", size: file.size, type: file.type });
      const { data, error } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type || "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        console.error("Gallery upload error:", JSON.stringify(error));
        toast.error("Upload fehlgeschlagen: " + (error.message || JSON.stringify(error)));
      } else {
        console.log("Gallery upload success:", data);
        await loadGallery();
      }
    } catch (err: any) {
      console.error("Gallery upload exception:", err);
      toast.error("Upload-Fehler: " + (err?.message || String(err)));
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Details */}
      <div className="card-equi p-4 space-y-3">
        <h3 className="font-heading text-sm font-semibold text-foreground">Stammdaten</h3>
        {horse.breed && <InfoRow label="Rasse" value={horse.breed} />}
        {horse.gender && <InfoRow label="Geschlecht" value={horse.gender === "mare" ? "Stute" : horse.gender === "gelding" ? "Wallach" : horse.gender === "stallion" ? "Hengst" : horse.gender} />}
        {horse.color && <InfoRow label="Farbe" value={horse.color} />}
        {horse.height_cm && <InfoRow label="Stockmaß" value={`${horse.height_cm} cm`} />}
        {!horse.breed && !horse.gender && !horse.color && !horse.height_cm && (
          <p className="text-sm text-muted-foreground">Noch keine Stammdaten eingetragen.</p>
        )}
      </div>

      {/* Contacts */}
      {(horse.vet_name || horse.farrier_name) && (
        <div className="card-equi p-4 space-y-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">Kontakte</h3>
          {horse.vet_name && <ContactRow label="Tierarzt" name={horse.vet_name} phone={horse.vet_phone ?? ""} />}
          {horse.farrier_name && <ContactRow label="Hufschmied" name={horse.farrier_name} phone={horse.farrier_phone ?? ""} />}
        </div>
      )}

      {/* History */}
      {horse.history && (
        <div className="card-equi p-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">Vorgeschichte / Diagnosen</h3>
          <p className="mt-2 text-sm text-muted-foreground">{horse.history}</p>
        </div>
      )}

      {/* Gallery */}
      <div className="card-equi p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground">Galerie</h3>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium text-primary disabled:opacity-50 flex items-center gap-1"
          >
            <Camera className="h-3 w-3" />
            {uploading ? "Lädt..." : "Foto hinzufügen"}
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryUpload}
            disabled={uploading}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {galleryPhotos.map((url, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          {galleryPhotos.length === 0 && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-white/40 hover:text-white/50 transition-colors cursor-pointer"
            >
              <Plus className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Sharing Toggles */}
      <SharingToggles horse={horse} onRefresh={onRefresh} />
    </div>
  );
}

function SharingToggles({ horse, onRefresh }: { horse: Horse; onRefresh: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);

  const toggle = async (field: "share_diary" | "share_positive" | "share_changes") => {
    setUpdating(field);
    const newVal = !(horse[field] ?? false);
    const { error } = await supabase.from("horses").update({ [field]: newVal } as any).eq("id", horse.id);
    if (error) toast.error("Fehler: " + error.message);
    else onRefresh();
    setUpdating(null);
  };

  const items = [
    { field: "share_diary" as const, label: "Trainingstagebuch" },
    { field: "share_positive" as const, label: "Positives" },
    { field: "share_changes" as const, label: "Veränderungen" },
  ];

  return (
    <div className="card-equi p-4 space-y-3">
      <h3 className="font-heading text-sm font-semibold text-foreground">Freigaben für Laura</h3>
      <p className="text-xs text-muted-foreground">Erlaube Laura, Einträge dieses Pferdes zu sehen.</p>
      {items.map(({ field, label }) => (
        <div key={field} className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <button
            onClick={() => toggle(field)}
            disabled={updating === field}
            className={cn(
              "relative h-6 w-10 rounded-full transition-colors",
              horse[field] ? "bg-primary" : "bg-white/20",
              updating === field && "opacity-50",
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              horse[field] && "translate-x-4",
            )} />
          </button>
        </div>
      ))}
    </div>
  );
}

function HorseReha({ horseId, rehaStatus, rehaStartDate }: { horseId: string; rehaStatus: string; rehaStartDate?: string | null }) {
  const [entries, setEntries] = useState<{ id: string; date: string; title: string | null; content: string; category: string | null; mood: string | null; photos: string[] | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reha_updates")
        .select("id,date,title,content,category,mood,photos")
        .eq("horse_id", horseId)
        .order("date", { ascending: false });
      setEntries((data as typeof entries) ?? []);
      setLoading(false);
    })();
  }, [horseId]);

  if (rehaStatus !== "active") {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
        <span className="text-4xl">🏥</span>
        <p className="mt-3 text-sm font-medium text-foreground">Keine aktive Reha</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Wenn dein Pferd in eine Reha aufgenommen wird, siehst du hier den Verlauf.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const daysSinceStart = rehaStartDate
    ? Math.max(1, Math.floor((Date.now() - new Date(rehaStartDate).getTime()) / 86400000))
    : null;

  const REHA_MOODS: Record<string, string> = { great: "😄", good: "🙂", okay: "😐", bad: "😕", poor: "�" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-reha/10 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-reha" />
        <span className="text-sm font-medium text-reha">
          Reha seit {rehaStartDate ? new Date(rehaStartDate).toLocaleDateString("de-DE") : "–"}
          {daysSinceStart ? ` · Tag ${daysSinceStart}` : ""}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Noch keine Einträge von Laura</p>
        </div>
      ) : (
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
          {entries.map((entry, idx) => (
            <CustomerRehaCard
              key={entry.id}
              entry={entry}
              moodMap={REHA_MOODS}
              isNew={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerRehaCard({
  entry,
  moodMap,
  isNew,
}: {
  entry: { id: string; date: string; title: string | null; content: string; category: string | null; mood: string | null; photos: string[] | null };
  moodMap: Record<string, string>;
  isNew?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "long" });

  return (
    <div className="relative">
      <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-reha bg-card" />
      <button onClick={() => setExpanded(!expanded)} className={cn("w-full text-left card-equi p-3", isNew && "ring-1 ring-reha/30")}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{formatDate(entry.date)}</span>
          <div className="flex items-center gap-1.5">
            {entry.category && <span className="text-xs text-muted-foreground">{entry.category}</span>}
            {entry.mood && <span>{moodMap[entry.mood] ?? entry.mood}</span>}
            {isNew && <span className="badge-new">Neu</span>}
          </div>
        </div>
        {entry.title && <h4 className="mt-1.5 text-sm font-semibold text-foreground">{entry.title}</h4>}
        <p className={cn("mt-1 text-sm text-muted-foreground", !expanded && "line-clamp-2")}>{entry.content}</p>

        {expanded && entry.photos && entry.photos.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {entry.photos.map((url, i) => (
              <img key={i} src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Activity type options ───────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  "Training",
  "Spaziergang",
  "Longieren",
  "Therapie",
  "Pflege",
  "Tierarzt",
  "Hufschmied",
  "Ruhetag",
  "Sonstiges",
];

const MOODS = [
  { value: "great", label: "😄 Super" },
  { value: "good", label: "🙂 Gut" },
  { value: "okay", label: "😐 Okay" },
  { value: "bad", label: "😕 Nicht so gut" },
];

// ─── HorseDiaryTab ───────────────────────────────────────────────────────────

function HorseDiaryTab({
  horseId,
  horseName,
  userId,
}: {
  horseId: string;
  horseName: string;
  userId: string;
}) {
  interface DiaryEntry {
    id: string;
    date: string;
    activity_type: string;
    duration_minutes: number | null;
    content: string | null;
    user_mood: string | null;
    horse_mood: string | null;
    notes: string | null;
  }

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<DiaryEntry | null>(null);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data } = await supabase
      .from("diary_entries")
      .select("id,date,activity_type,duration_minutes,content,user_mood,horse_mood,notes")
      .eq("horse_id", horseId)
      .order("date", { ascending: false })
      .limit(50);
    setEntries((data as DiaryEntry[]) ?? []);
    setLoadingEntries(false);
  }, [horseId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const moodLabel = (v: string | null) =>
    MOODS.find((m) => m.value === v)?.label ?? v ?? "";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loadingEntries) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        Neuer Tagebucheintrag
      </button>

      {entries.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
          <span className="text-4xl">📓</span>
          <p className="mt-3 text-sm font-medium text-foreground">Noch kein Eintrag</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dokumentiere deine Trainingseinheiten mit {horseName}
          </p>
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="card-equi p-4 space-y-2 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setViewEntry(entry)}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {entry.activity_type}
            </span>
          </div>
          {entry.duration_minutes && (
            <p className="text-xs text-muted-foreground">⏱ {entry.duration_minutes} Min.</p>
          )}
          {entry.content && (
            <p className="text-sm text-foreground line-clamp-2">{entry.content}</p>
          )}
          {(entry.user_mood || entry.horse_mood) && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              {entry.user_mood && <span>Ich: {moodLabel(entry.user_mood)}</span>}
              {entry.horse_mood && <span>{horseName}: {moodLabel(entry.horse_mood)}</span>}
            </div>
          )}
        </div>
      ))}

      {addOpen && (
        <AddDiaryEntrySheet
          horseId={horseId}
          horseName={horseName}
          userId={userId}
          onClose={() => setAddOpen(false)}
          onSaved={() => { loadEntries(); setAddOpen(false); }}
        />
      )}

      {viewEntry && (
        <ModalPortal>
          <div
            className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h2 className="font-heading text-lg font-bold text-white">📓 Tagebucheintrag</h2>
              <button onClick={() => setViewEntry(null)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{formatDate(viewEntry.date)}</span>
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">{viewEntry.activity_type}</span>
              </div>
              {viewEntry.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span>⏱</span>
                  <span>{viewEntry.duration_minutes} Minuten</span>
                </div>
              )}
              {viewEntry.content && (
                <div>
                  <label className="text-xs font-medium text-white/50">Beschreibung</label>
                  <p className="mt-1 text-sm text-white/90 leading-relaxed">{viewEntry.content}</p>
                </div>
              )}
              {(viewEntry.user_mood || viewEntry.horse_mood) && (
                <div className="flex gap-4 rounded-xl bg-white/5 p-3">
                  {viewEntry.user_mood && (
                    <div>
                      <span className="text-xs text-white/50">Meine Stimmung</span>
                      <p className="text-sm font-medium text-white">{moodLabel(viewEntry.user_mood)}</p>
                    </div>
                  )}
                  {viewEntry.horse_mood && (
                    <div>
                      <span className="text-xs text-white/50">{horseName}s Stimmung</span>
                      <p className="text-sm font-medium text-white">{moodLabel(viewEntry.horse_mood)}</p>
                    </div>
                  )}
                </div>
              )}
              {viewEntry.notes && (
                <div>
                  <label className="text-xs font-medium text-white/50">Notizen</label>
                  <p className="mt-1 text-sm text-white/70 italic leading-relaxed">{viewEntry.notes}</p>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

// ─── AddDiaryEntrySheet ──────────────────────────────────────────────────────

function AddDiaryEntrySheet({
  horseId,
  horseName,
  userId,
  onClose,
  onSaved,
}: {
  horseId: string;
  horseName: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [activityType, setActivityType] = useState("Training");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");
  const [userMood, setUserMood] = useState("");
  const [horseMood, setHorseMood] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("diary_entries").insert({
        horse_id: horseId,
        user_id: userId,
        date,
        activity_type: activityType,
        duration_minutes: duration ? parseInt(duration, 10) : null,
        content: content.trim() || null,
        user_mood: userMood || null,
        horse_mood: horseMood || null,
        notes: notes.trim() || null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">
            Neuer Eintrag
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          {/* Date */}
          <div>
            <label className="text-xs font-medium text-white/60">Datum</label>
            <input type="date" className="mt-1 form-input-glass" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Activity type */}
          <div>
            <label className="text-xs font-medium text-white/60">Art der Aktivität</label>
            <select className="mt-1 form-input-glass" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
              {ACTIVITY_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-white/60">Dauer (Minuten)</label>
            <input type="number" inputMode="numeric" className="mt-1 form-input-glass" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="z.B. 45" min={0} />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-medium text-white/60">Beschreibung</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Was habt ihr heute gemacht?`} />
          </div>

          {/* Moods */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/60">Meine Stimmung</label>
              <select className="mt-1 form-input-glass" value={userMood} onChange={(e) => setUserMood(e.target.value)}>
                <option value="">– wählen –</option>
                {MOODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">{horseName}s Stimmung</label>
              <select className="mt-1 form-input-glass" value={horseMood} onChange={(e) => setHorseMood(e.target.value)}>
                <option value="">– wählen –</option>
                {MOODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-white/60">Notizen</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Besonderheiten, Auffälligkeiten …" />
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-full glass-btn-primary py-3 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Eintrag speichern
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

const POSITIVE_CATEGORIES = [
  "Erfolg",
  "Schöner Moment",
  "Fortschritt",
  "Spaß",
  "Verbindung",
  "Gesundheit",
  "Sonstiges",
];

function HorsePositiveTab({
  horseId,
  horseName,
  userId,
}: {
  horseId: string;
  horseName: string;
  userId: string;
}) {
  interface PositiveEntry {
    id: string;
    date: string;
    content: string;
    category: string | null;
    photo_url: string | null;
  }

  const [entries, setEntries] = useState<PositiveEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<PositiveEntry | null>(null);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data } = await supabase
      .from("positive_entries")
      .select("id,date,content,category,photo_url")
      .eq("horse_id", horseId)
      .order("date", { ascending: false })
      .limit(50);
    setEntries((data as PositiveEntry[]) ?? []);
    setLoadingEntries(false);
  }, [horseId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    });

  if (loadingEntries) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground"
      >
        <Plus className="h-4 w-4" />
        Etwas Schönes festhalten ✨
      </button>

      {entries.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
          <span className="text-4xl">✨</span>
          <p className="mt-3 text-sm font-medium text-foreground">Noch kein Eintrag</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Halte schöne Momente und Erfolge von {horseName} fest
          </p>
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="card-equi p-4 space-y-2 cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all" onClick={() => setViewEntry(entry)}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
            {entry.category && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                {entry.category}
              </span>
            )}
          </div>
          {entry.photo_url && (
            <img
              src={entry.photo_url}
              alt=""
              className="w-full rounded-lg object-cover max-h-48"
            />
          )}
          <p className="text-sm text-foreground line-clamp-2">{entry.content}</p>
        </div>
      ))}

      {addOpen && (
        <AddPositiveEntrySheet
          horseId={horseId}
          horseName={horseName}
          userId={userId}
          onClose={() => setAddOpen(false)}
          onSaved={() => { loadEntries(); setAddOpen(false); }}
        />
      )}

      {viewEntry && (
        <ModalPortal>
          <div
            className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h2 className="font-heading text-lg font-bold text-white">✨ Schöner Moment</h2>
              <button onClick={() => setViewEntry(null)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{formatDate(viewEntry.date)}</span>
                {viewEntry.category && (
                  <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-accent-foreground">{viewEntry.category}</span>
                )}
              </div>
              {viewEntry.photo_url && (
                <img
                  src={viewEntry.photo_url}
                  alt=""
                  className="w-full rounded-xl object-cover max-h-80"
                />
              )}
              <p className="text-sm text-white/90 leading-relaxed">{viewEntry.content}</p>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

function AddPositiveEntrySheet({
  horseId,
  horseName,
  userId,
  onClose,
  onSaved,
}: {
  horseId: string;
  horseName: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Limit to 5 MB to avoid crashes
    if (f.size > 5 * 1024 * 1024) {
      setErrorMsg("Bild zu groß – bitte maximal 5 MB.");
      return;
    }
    setErrorMsg("");
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setErrorMsg("");
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/positive_${Date.now()}.${ext}`;
        photoUrl = await uploadImage("media", path, photoFile);
        if (!photoUrl) {
          setErrorMsg("Foto konnte nicht hochgeladen werden – Eintrag ohne Bild gespeichert.");
        }
      }
      const { error } = await supabase.from("positive_entries").insert({
        horse_id: horseId,
        user_id: userId,
        date,
        content: content.trim(),
        category: category || null,
        photo_url: photoUrl,
      });
      if (error) {
        setErrorMsg("Fehler beim Speichern: " + error.message);
        return;
      }
      onSaved();
    } catch (e) {
      setErrorMsg("Unbekannter Fehler – bitte erneut versuchen.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">
            Schönes festhalten ✨
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <div>
            <label className="text-xs font-medium text-white/60">Datum</label>
            <input type="date" className="mt-1 form-input-glass" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Kategorie</label>
            <select className="mt-1 form-input-glass" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">– optional –</option>
              {POSITIVE_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Was war schön? *</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={`z.B. ${horseName} hat heute zum ersten Mal entspannt gekaut …`} />
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Foto (optional)</label>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 p-3 hover:bg-white/5">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                  <Camera className="h-6 w-6 text-white/50" />
                </div>
              )}
              <span className="text-sm text-white/60">
                {photoPreview ? "Foto ändern" : "Foto hinzufügen"}
              </span>
              <span className="ml-auto text-xs text-white/40">max. 5 MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 flex-shrink-0 space-y-2">
          {errorMsg && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-300">
              {errorMsg}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-full glass-btn-primary py-3 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Eintrag speichern
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── HorseChangesTab ─────────────────────────────────────────────────────────

const CHANGE_CATEGORIES = [
  "Bewegung",
  "Muskulatur",
  "Verhalten",
  "Huf",
  "Haut/Fell",
  "Gewicht",
  "Fressverhalten",
  "Sonstiges",
];

const SEVERITY_LABELS: Record<string, string> = {
  low: "🟡 Gering",
  medium: "🟠 Mittel",
  high: "🔴 Hoch",
};

function HorseChangesTab({
  horseId,
  horseName,
  userId,
}: {
  horseId: string;
  horseName: string;
  userId: string;
}) {
  interface ChangeEntry {
    id: string;
    date: string;
    content: string;
    body_area: string | null;
    category: string | null;
    severity: string | null;
  }

  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<ChangeEntry | null>(null);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data } = await supabase
      .from("change_entries")
      .select("id,date,content,body_area,category,severity")
      .eq("horse_id", horseId)
      .order("date", { ascending: false })
      .limit(50);
    setEntries((data as ChangeEntry[]) ?? []);
    setLoadingEntries(false);
  }, [horseId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    });

  if (loadingEntries) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-info py-3 text-sm font-semibold text-info-foreground"
      >
        <Plus className="h-4 w-4" />
        Veränderung notieren 👁️
      </button>

      {entries.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 text-center">
          <span className="text-4xl">👁️</span>
          <p className="mt-3 text-sm font-medium text-foreground">Noch kein Eintrag</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Notiere Veränderungen bei {horseName}
          </p>
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="card-equi p-4 space-y-2 cursor-pointer hover:ring-1 hover:ring-info/30 transition-all" onClick={() => setViewEntry(entry)}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
            <div className="flex gap-1.5">
              {entry.severity && (
                <span className="text-xs">{SEVERITY_LABELS[entry.severity] ?? entry.severity}</span>
              )}
              {entry.category && (
                <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info-foreground">
                  {entry.category}
                </span>
              )}
            </div>
          </div>
          {entry.body_area && (
            <p className="text-xs font-medium text-muted-foreground">Bereich: {entry.body_area}</p>
          )}
          <p className="text-sm text-foreground line-clamp-2">{entry.content}</p>
        </div>
      ))}

      {addOpen && (
        <AddChangeEntrySheet
          horseId={horseId}
          horseName={horseName}
          userId={userId}
          onClose={() => setAddOpen(false)}
          onSaved={() => { loadEntries(); setAddOpen(false); }}
        />
      )}

      {viewEntry && (
        <ModalPortal>
          <div
            className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h2 className="font-heading text-lg font-bold text-white">👁️ Veränderung</h2>
              <button onClick={() => setViewEntry(null)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{formatDate(viewEntry.date)}</span>
                <div className="flex gap-1.5">
                  {viewEntry.severity && (
                    <span className="text-sm">{SEVERITY_LABELS[viewEntry.severity] ?? viewEntry.severity}</span>
                  )}
                  {viewEntry.category && (
                    <span className="rounded-full bg-info/20 px-2.5 py-1 text-xs font-semibold text-info-foreground">{viewEntry.category}</span>
                  )}
                </div>
              </div>
              {viewEntry.body_area && (
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-xs text-white/50">Körperstelle / Bereich</span>
                  <p className="text-sm font-medium text-white">{viewEntry.body_area}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-white/50">Beschreibung</label>
                <p className="mt-1 text-sm text-white/90 leading-relaxed">{viewEntry.content}</p>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

function AddChangeEntrySheet({
  horseId,
  horseName,
  userId,
  onClose,
  onSaved,
}: {
  horseId: string;
  horseName: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [content, setContent] = useState("");
  const [bodyArea, setBodyArea] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [sinceWhen, setSinceWhen] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await supabase.from("change_entries").insert({
        horse_id: horseId,
        user_id: userId,
        date,
        content: content.trim(),
        body_area: bodyArea.trim() || null,
        category: category || null,
        severity: severity || null,
        since_when: sinceWhen.trim() || null,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">
            Veränderung notieren 👁️
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <div>
            <label className="text-xs font-medium text-white/60">Datum</label>
            <input type="date" className="mt-1 form-input-glass" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/60">Kategorie</label>
              <select className="mt-1 form-input-glass" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">– optional –</option>
                {CHANGE_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">Schweregrad</label>
              <select className="mt-1 form-input-glass" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">– optional –</option>
                <option value="low">🟡 Gering</option>
                <option value="medium">🟠 Mittel</option>
                <option value="high">🔴 Hoch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Körperstelle / Bereich</label>
            <input className="mt-1 form-input-glass" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)} placeholder="z.B. linkes Hinterbein" />
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Seit wann?</label>
            <input className="mt-1 form-input-glass" value={sinceWhen} onChange={(e) => setSinceWhen(e.target.value)} placeholder="z.B. seit ca. 3 Tagen" />
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">Beschreibung *</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Was hast du bei ${horseName} beobachtet?`} />
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-full glass-btn-primary py-3 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Eintrag speichern
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

function HorsePlansTab() {
  return (
    <div className="space-y-3">
      <div className="card-equi p-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            Aufbau-Programm Phase 2
          </h4>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Zugewiesen am 01.04.2026 · von Laura
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/5 rounded-full bg-primary" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">9/15 Übungen erledigt</p>
      </div>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function uploadImage(
  bucket: string,
  path: string,
  file: File,
): Promise<string | null> {
  try {
    const options = { contentType: file.type || "image/jpeg" };
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);
    if (error) {
      console.error("Upload error:", error.message, error);
      // If duplicate, try with a slightly different path
      if (error.message?.includes("already exists") || error.message?.includes("Duplicate")) {
        const altPath = path.replace(/(\.\w+)$/, `_${Date.now()}$1`);
        const { error: retryErr } = await supabase.storage.from(bucket).upload(altPath, file, options);
        if (retryErr) {
          console.error("Upload retry error:", retryErr);
          return null;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(altPath);
        return `${data.publicUrl}?t=${Date.now()}`;
      }
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (e) {
    console.error("Upload exception:", e);
    return null;
  }
}

// ─── EditHorseSheet ──────────────────────────────────────────────────────────

function EditHorseSheet({
  horse,
  userId,
  onClose,
  onSaved,
  onDeleted,
}: {
  horse: Horse;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  const birthYear = horse.notes
    ? undefined
    : horse.history
      ? undefined
      : undefined;

  // derive birth year from birth_date column if present, else empty
  const initialYear =
    (horse as Horse & { birth_date?: string | null }).birth_date
      ?.slice(0, 4) ?? "";

  const [name, setName] = useState(horse.name ?? "");
  const [breed, setBreed] = useState(horse.breed ?? "");
  const [birthYearVal, setBirthYearVal] = useState(initialYear);
  const [color, setColor] = useState(horse.color ?? "");
  const [gender, setGender] = useState(horse.gender ?? "");
  const [vetName, setVetName] = useState(horse.vet_name ?? "");
  const [vetPhone, setVetPhone] = useState(horse.vet_phone ?? "");
  const [farrierName, setFarrierName] = useState(horse.farrier_name ?? "");
  const [farrierPhone, setFarrierPhone] = useState(horse.farrier_phone ?? "");
  const [notes, setNotes] = useState(horse.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState(horse.photo_url ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Reset input so the same file can be re-selected
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setPhotoError("Bild zu groß – max. 5 MB.");
      return;
    }
    setPhotoError("");
    setPhotoFile(f);
    setPhotoUrl(URL.createObjectURL(f));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete related entries (cascade should handle it, but be explicit)
      await supabase.from("diary_entries").delete().eq("horse_id", horse.id);
      await supabase.from("positive_entries").delete().eq("horse_id", horse.id);
      await supabase.from("change_entries").delete().eq("horse_id", horse.id);
      // Delete storage: gallery photos
      const { data: galleryFiles } = await supabase.storage.from("media").list(`${userId}/${horse.id}/gallery`);
      if (galleryFiles && galleryFiles.length > 0) {
        const paths = galleryFiles.map((f) => `${userId}/${horse.id}/gallery/${f.name}`);
        await supabase.storage.from("media").remove(paths);
      }
      // Delete the horse record
      const { error } = await supabase.from("horses").delete().eq("id", horse.id);
      if (error) {
        console.error("Horse delete error:", error);
        toast.error("Löschen fehlgeschlagen: " + error.message);
      } else {
        onDeleted?.();
      }
    } catch (e) {
      console.error("Delete exception:", e);
      toast.error("Fehler beim Löschen – bitte erneut versuchen.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let finalPhotoUrl = horse.photo_url ?? null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        // Use timestamp to avoid Supabase CDN cache
        const path = `${userId}/${horse.id}_${Date.now()}.${ext}`;
        const uploaded = await uploadImage("media", path, photoFile);
        if (uploaded) {
          finalPhotoUrl = uploaded;
        } else {
          toast.warning("Foto konnte nicht hochgeladen werden. Pferd wird ohne neues Bild gespeichert.");
        }
      }

      const birthDate =
        birthYearVal.trim().length === 4
          ? `${birthYearVal}-01-01`
          : null;

      const { error } = await supabase
        .from("horses")
        .update({
          name: name.trim(),
          breed: breed.trim() || null,
          birth_date: birthDate,
          color: color.trim() || null,
          gender: gender || null,
          vet_name: vetName.trim() || null,
          vet_phone: vetPhone.trim() || null,
          farrier_name: farrierName.trim() || null,
          farrier_phone: farrierPhone.trim() || null,
          notes: notes.trim() || null,
          photo_url: finalPhotoUrl,
        })
        .eq("id", horse.id);

      if (error) {
        console.error("Horse save error:", error);
        toast.error("Speichern fehlgeschlagen: " + error.message);
      } else {
        onSaved();
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="relative w-full max-w-md rounded-2xl glass-modal flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">
            Pferd bearbeiten
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="cursor-pointer group relative"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center text-4xl ring-2 ring-white/20">
                  🐴
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-white/60">Foto ändern</p>
            <p className="text-xs text-white/40">max. 5 MB</p>
            {photoError && <p className="text-xs text-red-400">{photoError}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-white/60">Name *</label>
            <input className="mt-1 form-input-glass" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Luna" />
          </div>

          {/* Breed */}
          <div>
            <label className="text-xs font-medium text-white/60">Rasse</label>
            <input className="mt-1 form-input-glass" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="z.B. Hannoveraner" />
          </div>

          {/* Birth year + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/60">Geburtsjahr</label>
              <input className="mt-1 form-input-glass" value={birthYearVal} onChange={(e) => setBirthYearVal(e.target.value)} placeholder="z.B. 2015" maxLength={4} inputMode="numeric" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">Farbe</label>
              <input className="mt-1 form-input-glass" value={color} onChange={(e) => setColor(e.target.value)} placeholder="z.B. Fuchs" />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs font-medium text-white/60">Geschlecht</label>
            <select className="mt-1 form-input-glass" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">– bitte wählen –</option>
              <option value="mare">Stute</option>
              <option value="gelding">Wallach</option>
              <option value="stallion">Hengst</option>
            </select>
          </div>

          {/* Vet */}
          <div>
            <label className="text-xs font-medium text-white/60">Tierarzt</label>
            <input className="mt-1 form-input-glass" value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="Name" />
            <input className="mt-2 form-input-glass" value={vetPhone} onChange={(e) => setVetPhone(e.target.value)} placeholder="Telefon" type="tel" />
          </div>

          {/* Farrier */}
          <div>
            <label className="text-xs font-medium text-white/60">Hufschmied</label>
            <input className="mt-1 form-input-glass" value={farrierName} onChange={(e) => setFarrierName(e.target.value)} placeholder="Name" />
            <input className="mt-2 form-input-glass" value={farrierPhone} onChange={(e) => setFarrierPhone(e.target.value)} placeholder="Telefon" type="tel" />
          </div>

          {/* Riding share / notes */}
          <div>
            <label className="text-xs font-medium text-white/60">Reitbeteiligung / Notizen</label>
            <textarea className="mt-1 form-input-glass resize-none" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z.B. Di+Do Reitbeteiligung, sonst keine Besonderheiten" />
          </div>

          {/* Delete horse */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Pferd löschen
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-full glass-btn-primary py-3 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Änderungen speichern
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl glass-modal p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white">Pferd löschen?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Bist du sicher? <span className="font-semibold text-white">{horse.name}</span> und alle
                zugehörigen Daten werden unwiderruflich gelöscht: Tagebucheinträge, Fotos, Veränderungen — alles.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500/80 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleting ? "Wird gelöscht..." : "Ja, löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ContactRow({
  label,
  name,
  phone,
}: {
  label: string;
  name: string;
  phone: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{name}</p>
      </div>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm active:scale-95 transition-transform touch-target"
        >
          <Phone className="h-3 w-3" />
          Anrufen
        </a>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Phone className="h-3 w-3" />
          Keine Nr.
        </span>
      )}
    </div>
  );
}
