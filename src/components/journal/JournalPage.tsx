import {
  BookOpen,
  Sparkles,
  Eye,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Camera,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearch } from "@tanstack/react-router";

async function uploadEntryPhoto(userId: string, file: File): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/journal/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { console.error("Photo upload error:", error); return null; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("Photo upload exception:", e);
    return null;
  }
}

function PhotoUploadField({ photos, setPhotos, previews, setPreviews }: {
  photos: File[];
  setPhotos: (f: File[]) => void;
  previews: string[];
  setPreviews: (p: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);
    setPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };
  const removePhoto = (idx: number) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    setPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  };
  return (
    <div>
      <label className="text-xs font-medium text-white/60">Fotos (optional)</label>
      <div className="mt-1 flex gap-2 flex-wrap">
        {previews.map((url, i) => (
          <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-16 w-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-white/40 hover:text-white/50 transition-colors"
          >
            <Camera className="h-5 w-5" />
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "training" | "positive" | "changes";

interface DiaryEntry {
  id: string;
  date: string;
  activity_type: string;
  duration_minutes: number | null;
  content: string | null;
  user_mood: string | null;
  horse_mood: string | null;
  notes: string | null;
  photos: string[] | null;
  horse_name?: string;
}

interface PositiveEntry {
  id: string;
  date: string;
  content: string;
  category: string | null;
  photo_url: string | null;
  horse_name?: string;
}

interface ChangeEntry {
  id: string;
  date: string;
  content: string;
  body_area: string | null;
  category: string | null;
  severity: string | null;
  photos: string[] | null;
  horse_name?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  "Training", "Spaziergang", "Longieren", "Therapie",
  "Pflege", "Tierarzt", "Hufschmied", "Ruhetag", "Sonstiges",
];

const POSITIVE_CATEGORIES = [
  "Erfolg", "Schöner Moment", "Fortschritt",
  "Spaß", "Verbindung", "Gesundheit", "Sonstiges",
];

const CHANGE_CATEGORIES = [
  "Bewegung", "Muskulatur", "Verhalten", "Huf",
  "Haut/Fell", "Gewicht", "Fressverhalten", "Sonstiges",
];

const MOODS = [
  { value: "great", label: "😄 Super" },
  { value: "good", label: "🙂 Gut" },
  { value: "okay", label: "😐 Okay" },
  { value: "bad", label: "😕 Nicht so gut" },
];

const SEVERITY_LABELS: Record<string, string> = {
  low: "🟡 Gering",
  medium: "🟠 Mittel",
  high: "🔴 Hoch",
};

const tabs: { id: TabId; label: string; emoji: string }[] = [
  { id: "training", label: "Training", emoji: "📓" },
  { id: "positive", label: "Positiv", emoji: "✨" },
  { id: "changes", label: "Veränderungen", emoji: "👁️" },
];

// ─── ModalPortal ─────────────────────────────────────────────────────────────

function ModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4">
      {children}
    </div>,
    document.body,
  );
}

// ─── Main JournalPage ────────────────────────────────────────────────────────

export function JournalPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/journal" }) as { tab?: string; add?: boolean; calendar?: boolean };
  const initialTab = (search.tab === "training" || search.tab === "positive" || search.tab === "changes") ? search.tab : "training";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [showCalendar, setShowCalendar] = useState(search.calendar === true);
  const [addOpen, setAddOpen] = useState(search.add === true);

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [positiveEntries, setPositiveEntries] = useState<PositiveEntry[]>([]);
  const [changeEntries, setChangeEntries] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [horses, setHorses] = useState<{ id: string; name: string }[]>([]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: horseData } = await supabase
      .from("horses")
      .select("id,name")
      .eq("owner_id", user.id)
      .eq("archived", false);
    const horseList = (horseData as { id: string; name: string }[]) ?? [];
    setHorses(horseList);
    const horseMap = Object.fromEntries(horseList.map((h) => [h.id, h.name]));

    const [diary, positive, changes] = await Promise.all([
      supabase
        .from("diary_entries")
        .select("id,date,activity_type,duration_minutes,content,user_mood,horse_mood,notes,photos,horse_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(100),
      supabase
        .from("positive_entries")
        .select("id,date,content,category,photo_url,horse_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(100),
      supabase
        .from("change_entries")
        .select("id,date,content,body_area,category,severity,photos,horse_id")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(100),
    ]);

    setDiaryEntries(
      ((diary.data ?? []) as (DiaryEntry & { horse_id: string })[]).map((e) => ({
        ...e,
        horse_name: horseMap[e.horse_id] ?? "",
      })),
    );
    setPositiveEntries(
      ((positive.data ?? []) as (PositiveEntry & { horse_id: string })[]).map((e) => ({
        ...e,
        horse_name: horseMap[e.horse_id] ?? "",
      })),
    );
    setChangeEntries(
      ((changes.data ?? []) as (ChangeEntry & { horse_id: string })[]).map((e) => ({
        ...e,
        horse_name: horseMap[e.horse_id] ?? "",
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const primaryHorse = horses[0] ?? null;

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-white drop-shadow">
          Tagebuch 📓
        </h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-full glass-btn-primary px-4 py-2 text-sm font-medium touch-target transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Eintrag
        </button>
      </div>

      {/* Tab Bar */}
      <div className="mt-4 flex gap-1 rounded-xl glass-panel p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-medium transition-all touch-target",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-white/50 hover:text-white/70",
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar Toggle */}
      <button
        onClick={() => setShowCalendar((v) => !v)}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm transition-colors touch-target",
          showCalendar
            ? "border-white/40 bg-white/15 text-white"
            : "border-white/20 text-white/60 hover:bg-white/10",
        )}
      >
        {showCalendar ? <List className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
        {showCalendar ? "Listenansicht" : "Kalenderansicht"}
      </button>

      {/* Calendar View */}
      {showCalendar && (
        <CalendarView
          diaryEntries={diaryEntries}
          positiveEntries={positiveEntries}
          changeEntries={changeEntries}
        />
      )}

      {/* Tab Content (hidden when calendar is open) */}
      {!showCalendar && (
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          ) : (
            <>
              {activeTab === "training" && (
                <TrainingEntriesView entries={diaryEntries} onAdd={() => setAddOpen(true)} />
              )}
              {activeTab === "positive" && (
                <PositiveEntriesView entries={positiveEntries} onAdd={() => setAddOpen(true)} />
              )}
              {activeTab === "changes" && (
                <ChangesEntriesView entries={changeEntries} onAdd={() => setAddOpen(true)} />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Add Entry Modals ── */}
      {addOpen && primaryHorse && user && activeTab === "training" && (
        <AddDiaryEntrySheet
          horseId={primaryHorse.id}
          horseName={primaryHorse.name}
          userId={user.id}
          onClose={() => setAddOpen(false)}
          onSaved={() => { loadAll(); setAddOpen(false); }}
        />
      )}
      {addOpen && primaryHorse && user && activeTab === "positive" && (
        <AddPositiveEntrySheet
          horseId={primaryHorse.id}
          horseName={primaryHorse.name}
          userId={user.id}
          onClose={() => setAddOpen(false)}
          onSaved={() => { loadAll(); setAddOpen(false); }}
        />
      )}
      {addOpen && primaryHorse && user && activeTab === "changes" && (
        <AddChangeEntrySheet
          horseId={primaryHorse.id}
          horseName={primaryHorse.name}
          userId={user.id}
          onClose={() => setAddOpen(false)}
          onSaved={() => { loadAll(); setAddOpen(false); }}
        />
      )}
      {addOpen && !primaryHorse && (
        <ModalPortal>
          <div className="glass-modal rounded-2xl p-6 text-center text-white max-w-xs w-full">
            <p className="text-2xl mb-3">🐴</p>
            <p className="font-semibold">Kein Pferd angelegt</p>
            <p className="text-sm text-white/70 mt-1 mb-4">
              Bitte zuerst ein Pferd im Profil anlegen.
            </p>
            <button
              onClick={() => setAddOpen(false)}
              className="glass-btn-primary rounded-full px-6 py-2 text-sm font-semibold"
            >
              OK
            </button>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView({
  diaryEntries,
  positiveEntries,
  changeEntries,
}: {
  diaryEntries: DiaryEntry[];
  positiveEntries: PositiveEntry[];
  changeEntries: ChangeEntry[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Touch swiping
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // ── Filter toggles (default: training selected) ──
  const [filterTraining, setFilterTraining] = useState(true);
  const [filterPositive, setFilterPositive] = useState(false);
  const [filterChanges, setFilterChanges] = useState(false);
  const [calendarDetail, setCalendarDetail] = useState<DetailEntry | null>(null);

  // Build day→entries map (only for active filters)
  const dayMap: Record<string, { diary: DiaryEntry[]; positive: PositiveEntry[]; changes: ChangeEntry[] }> = {};
  const ensure = (d: string) => {
    if (!dayMap[d]) dayMap[d] = { diary: [], positive: [], changes: [] };
  };
  if (filterTraining) {
    for (const e of diaryEntries) { ensure(e.date); dayMap[e.date].diary.push(e); }
  }
  if (filterPositive) {
    for (const e of positiveEntries) { ensure(e.date); dayMap[e.date].positive.push(e); }
  }
  if (filterChanges) {
    for (const e of changeEntries) { ensure(e.date); dayMap[e.date].changes.push(e); }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const startPad = firstDow === 0 ? 6 : firstDow - 1; // Mon=0

  const monthName = new Date(year, month).toLocaleString("de-DE", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayData = selectedDay ? dayMap[selectedDay] : null;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) prevMonth();
      else nextMonth();
    }
    setTouchStartX(null);
  };

  return (
    <div
      className="mt-3 glass-panel rounded-xl p-3 text-white select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-white/10 touch-target">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize">{monthName}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-white/10 touch-target">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setFilterTraining((v) => !v)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all touch-target",
            filterTraining
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-white/20 text-white/40",
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Training
        </button>
        <button
          onClick={() => setFilterPositive((v) => !v)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all touch-target",
            filterPositive
              ? "bg-amber-500/90 text-white shadow-sm"
              : "border border-white/20 text-white/40",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Positiv
        </button>
        <button
          onClick={() => setFilterChanges((v) => !v)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all touch-target",
            filterChanges
              ? "bg-violet-500/90 text-white shadow-sm"
              : "border border-white/20 text-white/40",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Veränderung
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div key={d} className="text-center text-[0.65rem] font-medium text-white/50 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const data = dayMap[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          const hasDiary = (data?.diary.length ?? 0) > 0;
          const hasPositive = (data?.positive.length ?? 0) > 0;
          const hasChanges = (data?.changes.length ?? 0) > 0;
          const hasAny = hasDiary || hasPositive || hasChanges;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(isSelected ? null : hasAny ? dateStr : null)}
              className={cn(
                "flex flex-col items-center rounded-lg py-1 transition-all",
                isSelected && "bg-white/25",
                isToday && !isSelected && "bg-white/10 ring-1 ring-white/40",
                hasAny && !isSelected && "hover:bg-white/10",
              )}
            >
              <span
                className={cn(
                  "text-xs leading-tight",
                  isToday ? "font-bold text-white" : "text-white/80",
                  !hasAny && !isToday && "text-white/40",
                )}
              >
                {day}
              </span>
              <div className="flex gap-0 mt-0.5 h-3">
                {hasDiary && <span className="text-[0.55rem] leading-none">📓</span>}
                {hasPositive && <span className="text-[0.55rem] leading-none">✨</span>}
                {hasChanges && <span className="text-[0.55rem] leading-none">👁️</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDayData && (
        <div className="mt-3 border-t border-white/15 pt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-xs font-semibold text-white/70">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {selectedDayData.diary.map((e) => (
            <button key={e.id} onClick={() => setCalendarDetail({ type: "training", entry: e })} className="glass-card rounded-xl p-3 w-full text-left active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">📓 {e.activity_type}</span>
                {e.horse_name && <span className="text-xs text-white/50">{e.horse_name}</span>}
              </div>
              {e.duration_minutes && (
                <p className="text-xs text-white/60 mt-0.5">⏱ {e.duration_minutes} Min.</p>
              )}
              {e.content && <p className="text-sm text-white/90 mt-1 line-clamp-2">{e.content}</p>}
            </button>
          ))}
          {selectedDayData.positive.map((e) => (
            <button key={e.id} onClick={() => setCalendarDetail({ type: "positive", entry: e })} className="glass-card rounded-xl p-3 w-full text-left active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">
                  ✨ {e.category ?? "Positiv"}
                </span>
                {e.horse_name && <span className="text-xs text-white/50">{e.horse_name}</span>}
              </div>
              <p className="text-sm text-white/90 mt-1 line-clamp-2">{e.content}</p>
            </button>
          ))}
          {selectedDayData.changes.map((e) => (
            <button key={e.id} onClick={() => setCalendarDetail({ type: "changes", entry: e })} className="glass-card rounded-xl p-3 w-full text-left active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">
                  👁️ {e.category ?? "Veränderung"}
                </span>
                {e.severity && (
                  <span className="text-xs">{SEVERITY_LABELS[e.severity] ?? e.severity}</span>
                )}
              </div>
              {e.body_area && (
                <p className="text-xs text-white/60 mt-0.5">Bereich: {e.body_area}</p>
              )}
              <p className="text-sm text-white/90 mt-1 line-clamp-2">{e.content}</p>
            </button>
          ))}
        </div>
      )}

      {/* Calendar detail modal */}
      {calendarDetail && (
        <EntryDetailSheet detail={calendarDetail} onClose={() => setCalendarDetail(null)} />
      )}

      {/* Hint when no filter is active */}
      {!filterTraining && !filterPositive && !filterChanges && (
        <p className="mt-4 text-center text-xs text-white/40">
          Wähle oben eine Kategorie aus, um Einträge im Kalender zu sehen.
        </p>
      )}
    </div>
  );
}

// ─── Entry Detail Sheet ──────────────────────────────────────────────────────

type DetailEntry =
  | { type: "training"; entry: DiaryEntry }
  | { type: "positive"; entry: PositiveEntry }
  | { type: "changes"; entry: ChangeEntry };

function EntryDetailSheet({ detail, onClose }: { detail: DetailEntry; onClose: () => void }) {
  const { type, entry } = detail;

  const title =
    type === "training" ? `📓 ${(entry as DiaryEntry).activity_type}` :
    type === "positive" ? `✨ ${(entry as PositiveEntry).category ?? "Positiv"}` :
    `👁️ ${(entry as ChangeEntry).category ?? "Veränderung"}`;

  const dateStr = new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Collect photos
  const photos: string[] = [];
  if (type === "training") {
    const d = entry as DiaryEntry;
    if (d.photos?.length) photos.push(...d.photos);
  } else if (type === "positive") {
    const p = entry as PositiveEntry;
    if (p.photo_url) photos.push(p.photo_url);
  } else {
    const c = entry as ChangeEntry;
    if (c.photos?.length) photos.push(...c.photos);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div
        className="glass-modal relative w-full max-w-md rounded-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-5 space-y-4 flex-1">
          {/* Date + Horse */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">{dateStr}</span>
            {entry.horse_name && (
              <span className="text-xs font-medium text-white/60">🐴 {entry.horse_name}</span>
            )}
          </div>

          {/* Training specific */}
          {type === "training" && (() => {
            const d = entry as DiaryEntry;
            return (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
                    {d.activity_type}
                  </span>
                  {d.duration_minutes && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                      ⏱ {d.duration_minutes} Min.
                    </span>
                  )}
                  {d.user_mood && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                      {MOODS.find(m => m.value === d.user_mood)?.label ?? d.user_mood}
                    </span>
                  )}
                  {d.horse_mood && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                      🐴 {MOODS.find(m => m.value === d.horse_mood)?.label ?? d.horse_mood}
                    </span>
                  )}
                </div>
                {d.content && (
                  <div>
                    <p className="text-xs font-medium text-white/50 mb-1">Beschreibung</p>
                    <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{d.content}</p>
                  </div>
                )}
                {d.notes && (
                  <div>
                    <p className="text-xs font-medium text-white/50 mb-1">Notizen</p>
                    <p className="text-sm italic text-white/70 leading-relaxed whitespace-pre-wrap">{d.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Positive specific */}
          {type === "positive" && (() => {
            const p = entry as PositiveEntry;
            return (
              <div className="space-y-3">
                {p.category && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                    {p.category}
                  </span>
                )}
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{p.content}</p>
              </div>
            );
          })()}

          {/* Change specific */}
          {type === "changes" && (() => {
            const c = entry as ChangeEntry;
            return (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {c.category && (
                    <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-300">
                      {c.category}
                    </span>
                  )}
                  {c.severity && (
                    <span className="inline-flex items-center rounded-full bg-warning/20 px-2.5 py-1 text-xs font-medium text-warning">
                      {SEVERITY_LABELS[c.severity] ?? c.severity}
                    </span>
                  )}
                </div>
                {c.body_area && (
                  <div>
                    <p className="text-xs font-medium text-white/50 mb-1">Bereich</p>
                    <p className="text-sm text-white/90">{c.body_area}</p>
                  </div>
                )}
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            );
          })()}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/50 mb-2">Fotos</p>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full rounded-xl object-cover max-h-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(url, "_blank")}
                  />
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

// ─── Entry List Views ────────────────────────────────────────────────────────

function TrainingEntriesView({
  entries,
  onAdd,
}: {
  entries: DiaryEntry[];
  onAdd: () => void;
}) {
  const [detail, setDetail] = useState<DiaryEntry | null>(null);

  if (entries.length === 0) {
    return (
      <EmptyState
        emoji="📓"
        text="Noch kein Training eingetragen"
        cta="Erste Einheit eintragen"
        onCta={onAdd}
      />
    );
  }
  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <button key={e.id} onClick={() => setDetail(e)} className="glass-card rounded-xl p-4 w-full text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              {fmtDate(e.date)}
            </span>
            {e.horse_name && (
              <span className="text-xs text-white/50">{e.horse_name}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
            <span>{e.activity_type}</span>
            {e.duration_minutes && (
              <>
                <span>·</span>
                <span>⏱ {e.duration_minutes} Min.</span>
              </>
            )}
            {e.user_mood && (
              <>
                <span>·</span>
                <span>{MOODS.find((m) => m.value === e.user_mood)?.label ?? e.user_mood}</span>
              </>
            )}
          </div>
          {e.content && <p className="mt-2 text-sm text-white/90 line-clamp-2">{e.content}</p>}
          {(e.photos?.length ?? 0) > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-white/40">
              <Camera className="h-3 w-3" /> {e.photos!.length} Foto{e.photos!.length > 1 ? "s" : ""}
            </div>
          )}
        </button>
      ))}
      {detail && (
        <EntryDetailSheet detail={{ type: "training", entry: detail }} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function PositiveEntriesView({
  entries,
  onAdd,
}: {
  entries: PositiveEntry[];
  onAdd: () => void;
}) {
  const [detail, setDetail] = useState<PositiveEntry | null>(null);

  if (entries.length === 0) {
    return (
      <EmptyState
        emoji="✨"
        text="Halte schöne Momente fest"
        cta="Schönes notieren"
        onCta={onAdd}
      />
    );
  }
  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <button key={e.id} onClick={() => setDetail(e)} className="glass-card rounded-xl p-4 w-full text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">
              {e.category ? `✨ ${e.category}` : "✨ Positiv"} · {fmtDateShort(e.date)}
            </span>
            {e.horse_name && (
              <span className="text-xs text-white/50">{e.horse_name}</span>
            )}
          </div>
          <p className="mt-2 text-sm text-white/90 line-clamp-2">{e.content}</p>
          {e.photo_url && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-white/40">
              <Camera className="h-3 w-3" /> 1 Foto
            </div>
          )}
        </button>
      ))}
      {detail && (
        <EntryDetailSheet detail={{ type: "positive", entry: detail }} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function ChangesEntriesView({
  entries,
  onAdd,
}: {
  entries: ChangeEntry[];
  onAdd: () => void;
}) {
  const [detail, setDetail] = useState<ChangeEntry | null>(null);

  if (entries.length === 0) {
    return (
      <EmptyState
        emoji="👁️"
        text="Achte auf Veränderungen bei deinem Pferd"
        cta="Veränderung notieren"
        onCta={onAdd}
      />
    );
  }
  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <button key={e.id} onClick={() => setDetail(e)} className="glass-card rounded-xl p-4 w-full text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              <span className="text-xs font-medium text-white">
                {e.category ?? "Veränderung"}
              </span>
            </div>
            <span className="text-xs text-white/50">{fmtDateShort(e.date)}</span>
          </div>
          {e.body_area && (
            <p className="mt-1 text-xs text-white/60">Bereich: {e.body_area}</p>
          )}
          <p className="mt-2 text-sm text-white/90 line-clamp-2">{e.content}</p>
          {e.severity && (
            <span className="mt-2 inline-block rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
              {SEVERITY_LABELS[e.severity] ?? e.severity}
            </span>
          )}
          {(e.photos?.length ?? 0) > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-white/40">
              <Camera className="h-3 w-3" /> {e.photos!.length} Foto{e.photos!.length > 1 ? "s" : ""}
            </div>
          )}
        </button>
      ))}
      {detail && (
        <EntryDetailSheet detail={{ type: "changes", entry: detail }} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function EmptyState({
  emoji,
  text,
  cta,
  onCta,
}: {
  emoji: string;
  text: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/20 py-10 text-center">
      <span className="text-3xl">{emoji}</span>
      <p className="mt-2 text-sm text-white/60">{text}</p>
      <button
        onClick={onCta}
        className="mt-3 glass-btn-primary rounded-full px-5 py-2 text-sm font-semibold touch-target"
      >
        {cta}
      </button>
    </div>
  );
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function fmtDateShort(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
  });
}

// ─── Add Diary Entry Sheet ───────────────────────────────────────────────────

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
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of photos) {
        const url = await uploadEntryPhoto(userId, file);
        if (url) photoUrls.push(url);
      }
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
        photos: photoUrls,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="glass-modal relative w-full max-w-md rounded-2xl flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        <SheetHeader title="Neues Training 📓" onClose={onClose} />
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <FormField label="Datum">
            <input
              type="date"
              className="form-input-glass"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <FormField label="Aktivität">
            <select
              className="form-input-glass"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Dauer (Minuten)">
            <input
              type="number"
              className="form-input-glass"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="z.B. 45"
            />
          </FormField>
          <FormField label="Beschreibung">
            <textarea
              className="form-input-glass resize-none"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Was war heute mit ${horseName}?`}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Meine Stimmung">
              <select
                className="form-input-glass"
                value={userMood}
                onChange={(e) => setUserMood(e.target.value)}
              >
                <option value="">– –</option>
                {MOODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={`Stimmung ${horseName}`}>
              <select
                className="form-input-glass"
                value={horseMood}
                onChange={(e) => setHorseMood(e.target.value)}
              >
                <option value="">– –</option>
                {MOODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <PhotoUploadField photos={photos} setPhotos={setPhotos} previews={photoPreviews} setPreviews={setPhotoPreviews} />
          <FormField label="Notizen">
            <textarea
              className="form-input-glass resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Zusatznotizen …"
            />
          </FormField>
        </div>
        <SheetFooter onSave={handleSave} saving={saving} disabled={false} />
      </div>
    </ModalPortal>
  );
}

// ─── Add Positive Entry Sheet ────────────────────────────────────────────────

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
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      let photo_url: string | null = null;
      if (photos.length > 0) {
        photo_url = await uploadEntryPhoto(userId, photos[0]);
      }
      await supabase.from("positive_entries").insert({
        horse_id: horseId,
        user_id: userId,
        date,
        content: content.trim(),
        category: category || null,
        photo_url,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="glass-modal relative w-full max-w-md rounded-2xl flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        <SheetHeader title="Schönes festhalten ✨" onClose={onClose} />
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <FormField label="Datum">
            <input
              type="date"
              className="form-input-glass"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <FormField label="Kategorie">
            <select
              className="form-input-glass"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">– optional –</option>
              {POSITIVE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Was war schön? *">
            <textarea
              className="form-input-glass resize-none"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`z.B. ${horseName} hat heute so schön entspannt …`}
            />
          </FormField>
          <PhotoUploadField photos={photos} setPhotos={setPhotos} previews={photoPreviews} setPreviews={setPhotoPreviews} />
        </div>
        <SheetFooter onSave={handleSave} saving={saving} disabled={!content.trim()} />
      </div>
    </ModalPortal>
  );
}

// ─── Add Change Entry Sheet ──────────────────────────────────────────────────

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
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const file of photos) {
        const url = await uploadEntryPhoto(userId, file);
        if (url) photoUrls.push(url);
      }
      await supabase.from("change_entries").insert({
        horse_id: horseId,
        user_id: userId,
        date,
        content: content.trim(),
        body_area: bodyArea.trim() || null,
        category: category || null,
        severity: severity || null,
        photos: photoUrls,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="glass-modal relative w-full max-w-md rounded-2xl flex flex-col"
        style={{ maxHeight: "90dvh" }}
      >
        <SheetHeader title="Veränderung notieren 👁️" onClose={onClose} />
        <div className="overflow-y-auto px-5 space-y-4 pb-2 flex-1">
          <FormField label="Datum">
            <input
              type="date"
              className="form-input-glass"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategorie">
              <select
                className="form-input-glass"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">– optional –</option>
                {CHANGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Schweregrad">
              <select
                className="form-input-glass"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="">– optional –</option>
                <option value="low">🟡 Gering</option>
                <option value="medium">🟠 Mittel</option>
                <option value="high">🔴 Hoch</option>
              </select>
            </FormField>
          </div>
          <FormField label="Körperstelle / Bereich">
            <input
              className="form-input-glass"
              value={bodyArea}
              onChange={(e) => setBodyArea(e.target.value)}
              placeholder="z.B. linkes Hinterbein"
            />
          </FormField>
          <FormField label="Beschreibung *">
            <textarea
              className="form-input-glass resize-none"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Was hast du bei ${horseName} beobachtet?`}
            />
          </FormField>
          <PhotoUploadField photos={photos} setPhotos={setPhotos} previews={photoPreviews} setPreviews={setPhotoPreviews} />
        </div>
        <SheetFooter onSave={handleSave} saving={saving} disabled={!content.trim()} />
      </div>
    </ModalPortal>
  );
}

// ─── Shared Sheet Components ─────────────────────────────────────────────────

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
      <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
      <button
        onClick={onClose}
        className="rounded-full p-1.5 text-white/60 hover:bg-white/10 touch-target"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function SheetFooter({
  onSave,
  saving,
  disabled,
}: {
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  return (
    <div className="px-5 pb-5 pt-3 flex-shrink-0">
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="w-full flex items-center justify-center gap-2 rounded-full glass-btn-primary py-3 text-sm font-semibold disabled:opacity-50 touch-target"
      >
        {saving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Eintrag speichern
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/60">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
