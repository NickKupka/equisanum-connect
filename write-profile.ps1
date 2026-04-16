$code = @'
import {
  ChevronRight,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  Trash2,
  MessageCircle,
  FileText,
  X,
  Save,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Horse {
  id: string;
  name: string;
  breed?: string | null;
  reha_status: string;
  photo_url?: string | null;
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
    else if (saved === "light") { document.documentElement.classList.remove("dark"); setDark(false); }
  }, []);
  return { dark, toggle };
}

export function ProfilePage() {
  const { profile, signOut, user, refetchProfile } = useAuth();
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "Nutzer";

  const [editOpen, setEditOpen] = useState(false);
  const [addHorseOpen, setAddHorseOpen] = useState(false);
  const [horses, setHorses] = useState<Horse[]>([]);
  const { dark, toggle: toggleDark } = useDarkMode();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("horses")
      .select("id, name, breed, reha_status, photo_url")
      .eq("owner_id", user.id)
      .eq("archived", false)
      .then(({ data }) => setHorses((data as Horse[]) ?? []));
  }, [user]);

  const refreshHorses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("horses")
      .select("id, name, breed, reha_status, photo_url")
      .eq("owner_id", user.id)
      .eq("archived", false);
    setHorses((data as Horse[]) ?? []);
  };

  return (
    <div className="py-5 pb-24">
      <div className="flex flex-col items-center px-4">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-linen ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profilbild" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">&#x1F469;</div>
          )}
        </div>
        <h1 className="mt-3 font-heading text-xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
        {profile?.phone && <p className="mt-0.5 text-xs text-muted-foreground">&#x1F4DE; {profile.phone}</p>}
        <button
          onClick={() => setEditOpen(true)}
          className="mt-3 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted touch-target"
        >
          Profil bearbeiten
        </button>
      </div>

      <div className="mt-6 px-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Meine Pferde</h2>
        <div className="mt-3 space-y-2">
          {horses.map((horse) => (
            <HorseCard key={horse.id} horse={horse} />
          ))}
          {horses.length === 0 && (
            <p className="py-3 text-center text-sm text-muted-foreground">Noch kein Pferd eingetragen.</p>
          )}
          <button
            onClick={() => setAddHorseOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted touch-target"
          >
            + Pferd hinzufuegen
          </button>
        </div>
      </div>

      <div className="mt-6 px-4 space-y-1">
        <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Einstellungen</h2>
        <SettingsRow icon={Bell} label="Benachrichtigungen" />
        <SettingsRow icon={Moon} label="Dark Mode" hasToggle toggleOn={dark} onClick={toggleDark} />
        <SettingsRow icon={Globe} label="Sprache" value="Deutsch" />
        <SettingsRow icon={Shield} label="Tagebuch-Sichtbarkeit" />
      </div>

      <div className="mt-4 px-4 space-y-1">
        <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mehr</h2>
        <SettingsRow icon={MessageCircle} label="Feedback an Laura" />
        <SettingsRow icon={HelpCircle} label="Hilfe / FAQ" />
        <SettingsRow icon={FileText} label="Impressum und Datenschutz" />
      </div>

      <div className="mt-4 px-4 space-y-1">
        <SettingsRow icon={LogOut} label="Abmelden" variant="default" onClick={signOut} />
        <SettingsRow icon={Trash2} label="Account loeschen" variant="danger" />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">EquiSanum v1.0.0</p>

      {editOpen && (
        <EditProfileSheet
          profile={profile}
          userId={user?.id ?? ""}
          onClose={() => setEditOpen(false)}
          onSaved={() => { refetchProfile?.(); setEditOpen(false); }}
        />
      )}
      {addHorseOpen && (
        <AddHorseSheet
          userId={user?.id ?? ""}
          onClose={() => setAddHorseOpen(false)}
          onSaved={() => { refreshHorses(); setAddHorseOpen(false); }}
        />
      )}
    </div>
  );
}

async function uploadImage(bucket: string, path: string, file: File): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function EditProfileSheet({
  profile,
  userId,
  onClose,
  onSaved,
}: {
  profile: { first_name?: string | null; last_name?: string | null; phone?: string | null; bio?: string | null; avatar_url?: string | null } | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    let avatar_url = profile?.avatar_url ?? null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const url = await uploadImage("avatars", `${userId}/avatar.${ext}`, avatarFile);
      if (url) avatar_url = url;
    }
    await supabase.from("profiles").update({
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      avatar_url,
    }).eq("user_id", userId);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card flex flex-col shadow-xl" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-foreground">Profil bearbeiten</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted touch-target"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto px-6 space-y-4 flex-1">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-20">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-linen">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-3xl">&#x1F469;</div>
                }
              </div>
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">Tippen um Foto zu aendern</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Vorname</label>
            <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Vorname" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nachname</label>
            <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nachname" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Telefon</label>
            <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 ..." type="tel" />
          </div>
          <div className="pb-2">
            <label className="text-xs font-medium text-muted-foreground">Ueber mich</label>
            <textarea className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kurze Beschreibung..." rows={3} />
          </div>
        </div>
        <div className="px-6 py-4 flex-shrink-0">
          <button onClick={handleSave} disabled={saving || !firstName.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50 touch-target">
            <Save className="h-4 w-4" />
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddHorseSheet({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [color, setColor] = useState("");
  const [gender, setGender] = useState("");
  const [vetName, setVetName] = useState("");
  const [vetPhone, setVetPhone] = useState("");
  const [farrierName, setFarrierName] = useState("");
  const [farrierPhone, setFarrierPhone] = useState("");
  const [ridingShare, setRidingShare] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const birth_date = birthYear.trim() ? `${birthYear.trim()}-01-01` : null;
    const horseId = crypto.randomUUID();
    let photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      photo_url = await uploadImage("horses", `${userId}/${horseId}.${ext}`, photoFile);
    }
    await supabase.from("horses").insert({
      id: horseId,
      owner_id: userId,
      name: name.trim(),
      breed: breed.trim() || null,
      birth_date,
      color: color.trim() || null,
      gender: gender || null,
      vet_name: vetName.trim() || null,
      vet_phone: vetPhone.trim() || null,
      farrier_name: farrierName.trim() || null,
      farrier_phone: farrierPhone.trim() || null,
      notes: ridingShare.trim() ? `Reitbeteiligung: ${ridingShare.trim()}` : null,
      photo_url,
    });
    setSaving(false);
    onSaved();
  };

  const ic = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
  const lc = "text-xs font-medium text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card flex flex-col shadow-xl" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-foreground">Pferd hinzufuegen</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted touch-target"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto px-6 flex-1">
          <div className="space-y-4 pb-2">
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="relative h-24 w-24 overflow-hidden rounded-xl bg-linen flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors">
                {photoPreview ? <img src={photoPreview} alt="Pferd" className="h-full w-full object-cover" /> : <span className="text-4xl">&#x1F434;</span>}
                <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"><Camera className="h-3 w-3" /></div>
              </button>
              <span className="text-xs text-muted-foreground">Tippen um Foto hinzuzufuegen</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
            </div>
            <div>
              <label className={lc}>Name *</label>
              <input className={ic} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Luna" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Rasse</label>
                <input className={ic} value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="z.B. Oldenburger" />
              </div>
              <div>
                <label className={lc}>Geburtsjahrgang</label>
                <input className={ic} value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="z.B. 2014" maxLength={4} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Farbe / Abzeichen</label>
                <input className={ic} value={color} onChange={(e) => setColor(e.target.value)} placeholder="z.B. Fuchs" />
              </div>
              <div>
                <label className={lc}>Geschlecht</label>
                <select className={ic} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">-- waehlen --</option>
                  <option value="mare">Stute</option>
                  <option value="gelding">Wallach</option>
                  <option value="stallion">Hengst</option>
                </select>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tierarzt</p>
              <div><label className={lc}>Name</label><input className={ic} value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="Dr. Mustermann" /></div>
              <div><label className={lc}>Telefon</label><input className={ic} value={vetPhone} onChange={(e) => setVetPhone(e.target.value)} placeholder="+49 ..." type="tel" /></div>
            </div>
            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hufschmied</p>
              <div><label className={lc}>Name</label><input className={ic} value={farrierName} onChange={(e) => setFarrierName(e.target.value)} placeholder="Hans Weber" /></div>
              <div><label className={lc}>Telefon</label><input className={ic} value={farrierPhone} onChange={(e) => setFarrierPhone(e.target.value)} placeholder="+49 ..." type="tel" /></div>
            </div>
            <div className="pb-2">
              <label className={lc}>Reitbeteiligung (Name / Kontakt)</label>
              <input className={ic} value={ridingShare} onChange={(e) => setRidingShare(e.target.value)} placeholder="z.B. Anna Muster, +49 170 ..." />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex-shrink-0">
          <button onClick={handleSave} disabled={saving || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50 touch-target">
            {saving ? "Wird gespeichert..." : "&#x1F434; Pferd anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HorseCard({ horse }: { horse: Horse }) {
  const statusLabel = horse.reha_status === "active" ? "In Reha" : horse.reha_status === "none" ? "Aktiv" : horse.reha_status === "completed" ? "Abgeschlossen" : horse.reha_status;
  const statusClass = horse.reha_status === "active" ? "bg-reha/10 text-reha" : horse.reha_status === "completed" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground";
  return (
    <button className="flex w-full items-center gap-3 rounded-xl p-3 card-equi transition-colors hover:bg-muted/50 touch-target text-left">
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-linen">
        {horse.photo_url ? <img src={horse.photo_url} alt={horse.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl">&#x1F434;</div>}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{horse.name}</p>
        <p className="text-xs text-muted-foreground">{horse.breed ?? "Rasse unbekannt"}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", statusClass)}>{statusLabel}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function SettingsRow({ icon: Icon, label, value, hasToggle, toggleOn, variant = "default", onClick }: { icon: React.ElementType; label: string; value?: string; hasToggle?: boolean; toggleOn?: boolean; variant?: "default" | "danger"; onClick?: () => void; }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted touch-target", variant === "danger" && "text-destructive")}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      {hasToggle && (
        <div className={cn("h-5 w-9 rounded-full p-0.5 transition-colors", toggleOn ? "bg-primary" : "bg-muted")}>
          <div className={cn("h-4 w-4 rounded-full bg-white shadow-sm transition-transform", toggleOn ? "translate-x-4" : "translate-x-0")} />
        </div>
      )}
      {!value && !hasToggle && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}
'@

[System.IO.File]::WriteAllText("c:\Projects\workspace\equisanum-connect-main\src\components\profile\ProfilePage.tsx", $code, [System.Text.Encoding]::UTF8)
Write-Host "Done"
