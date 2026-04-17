import {
  ChevronRight,
  HelpCircle,
  LogOut,
  Trash2,
  MessageCircle,
  FileText,
  X,
  Save,
  Camera,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface Horse {
  id: string;
  name: string;
  breed?: string | null;
  reha_status: string;
  photo_url?: string | null;
}



export function ProfilePage() {
  const { profile, signOut, user, refetchProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "Nutzer";

  const [editOpen, setEditOpen] = useState(false);
  const [addHorseOpen, setAddHorseOpen] = useState(false);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [impOpen, setImpOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
        {(profile as any)?.city && (
          <p className="mt-0.5 text-xs text-muted-foreground">📍 {[(profile as any)?.zip_code, (profile as any)?.city].filter(Boolean).join(" ")}</p>
        )}
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
        <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mehr</h2>
        <SettingsRow icon={MessageCircle} label="Feedback an Laura" onClick={() => setFeedbackOpen(true)} />
        <SettingsRow icon={HelpCircle} label="Hilfe / FAQ" onClick={() => setFaqOpen(true)} />
        <SettingsRow icon={FileText} label="Impressum und Datenschutz" onClick={() => setImpOpen(true)} />
        {isAdmin && (
          <SettingsRow icon={ShieldAlert} label="Adminbereich" onClick={() => navigate({ to: "/admin" })} />
        )}
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
          onSaved={async () => { await refetchProfile?.(); setEditOpen(false); }}
        />
      )}
      {addHorseOpen && (
        <AddHorseSheet
          userId={user?.id ?? ""}
          onClose={() => setAddHorseOpen(false)}
          onSaved={() => { refreshHorses(); setAddHorseOpen(false); }}
        />
      )}

      {impOpen && <ImpressumDatenschutzModal onClose={() => setImpOpen(false)} />}
      {faqOpen && <HilfeFaqModal onClose={() => setFaqOpen(false)} />}
      {feedbackOpen && user && (
        <FeedbackModal
          userId={user.id}
          horses={horses}
          onClose={() => setFeedbackOpen(false)}
          onSent={() => setFeedbackOpen(false)}
        />
      )}
    </div>
  );
}

async function uploadImage(bucket: string, path: string, file: File): Promise<string | null> {
  try {
    const options = { contentType: file.type || "image/jpeg" };
    const { error } = await supabase.storage.from(bucket).upload(path, file, options);
    if (error) {
      // If already exists, try with a slightly different path
      if (error.message?.includes("already exists") || error.message?.includes("Duplicate")) {
        const altPath = path.replace(/(\.\w+)$/, `_${Date.now()}$1`);
        const { error: retryErr } = await supabase.storage.from(bucket).upload(altPath, file, options);
        if (retryErr) { console.error("Upload retry error:", retryErr); return null; }
        const { data } = supabase.storage.from(bucket).getPublicUrl(altPath);
        return `${data.publicUrl}?t=${Date.now()}`;
      }
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (e) {
    console.error("Upload exception:", e);
    return null;
  }
}

function EditProfileSheet({
  profile,
  userId,
  onClose,
  onSaved,
}: {
  profile: { first_name?: string | null; last_name?: string | null; phone?: string | null; bio?: string | null; avatar_url?: string | null; street?: string | null; zip_code?: string | null; city?: string | null } | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [street, setStreet] = useState(profile?.street ?? "");
  const [zipCode, setZipCode] = useState(profile?.zip_code ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setAvatarError("Bild zu groß – max. 5 MB.");
      return;
    }
    setAvatarError("");
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url ?? null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        // Use media bucket which has confirmed working policies
        const url = await uploadImage("media", `${userId}/avatar_${Date.now()}.${ext}`, avatarFile);
        if (url) {
          avatar_url = url;
        } else {
          toast.warning("Profilbild konnte nicht hochgeladen werden. Profil wird ohne neues Bild gespeichert.");
        }
      }
      const updates = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        street: street.trim() || null,
        zip_code: zipCode.trim() || null,
        city: city.trim() || null,
        avatar_url,
      };
      const { error, data } = await supabase.from("profiles").update(updates).eq("user_id", userId).select();
      if (error) {
        console.error("Profile save error:", error);
        toast.error("Speichern fehlgeschlagen: " + error.message);
      } else if (!data || data.length === 0) {
        console.error("Profile save: no rows updated - profile may not exist for user_id:", userId);
        // Try to insert if profile doesn't exist yet
        const { error: insertErr } = await supabase.from("profiles").insert({ user_id: userId, ...updates });
        if (insertErr) {
          toast.error("Profil konnte nicht gespeichert werden: " + insertErr.message);
        } else {
          onSaved();
        }
      } else {
        onSaved();
      }
    } catch (e) {
      console.error("Profile save exception:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl glass-modal flex flex-col" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Profil bearbeiten</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target"><X className="h-5 w-5 text-white/60" /></button>
        </div>
        <div className="overflow-y-auto px-6 space-y-4 flex-1">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-20">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-white/10">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-3xl">&#x1F469;</div>
                }
              </div>
              <button type="button" onClick={(e) => { e.preventDefault(); fileRef.current?.click(); }} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-xs text-white/60">Tippen um Foto zu aendern</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            <span className="text-xs text-white/40">max. 5 MB</span>
            {avatarError && <span className="text-xs text-red-400">{avatarError}</span>}
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Vorname</label>
            <input className="mt-1 form-input-glass" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Vorname" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Nachname</label>
            <input className="mt-1 form-input-glass" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nachname" />
          </div>
          <div>
            <label className="text-xs font-medium text-white/60">Telefon</label>
            <input className="mt-1 form-input-glass" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 ..." type="tel" />
          </div>
          <div className="rounded-xl border border-white/10 p-3 space-y-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Adresse <span className="normal-case font-normal">(nur für dich & Laura sichtbar)</span></p>
            <div>
              <label className="text-xs font-medium text-white/60">Straße & Hausnr.</label>
              <input className="mt-1 form-input-glass" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="z.B. Musterstraße 12" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-white/60">PLZ</label>
                <input className="mt-1 form-input-glass" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="85354" maxLength={5} inputMode="numeric" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-white/60">Ort</label>
                <input className="mt-1 form-input-glass" value={city} onChange={(e) => setCity(e.target.value)} placeholder="z.B. Freising" />
              </div>
            </div>
          </div>
          <div className="pb-2">
            <label className="text-xs font-medium text-white/60">Ueber mich</label>
            <textarea className="mt-1 form-input-glass resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kurze Beschreibung..." rows={3} />
          </div>
        </div>
        <div className="px-6 py-4 flex-shrink-0">
          <button onClick={handleSave} disabled={saving || !firstName.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl glass-btn-primary py-3 text-sm font-semibold transition-opacity disabled:opacity-50 touch-target">
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
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setPhotoError("Bild zu groß – max. 5 MB.");
      return;
    }
    setPhotoError("");
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
      photo_url = await uploadImage("media", `${userId}/${horseId}.${ext}`, photoFile);
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

  const ic = "mt-1 form-input-glass";
  const lc = "text-xs font-medium text-white/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl glass-modal flex flex-col" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Pferd hinzufuegen</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target"><X className="h-5 w-5 text-white/60" /></button>
        </div>
        <div className="overflow-y-auto px-6 flex-1">
          <div className="space-y-4 pb-2">
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="relative h-24 w-24 overflow-hidden rounded-xl bg-linen flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors">
                {photoPreview ? <img src={photoPreview} alt="Pferd" className="h-full w-full object-cover" /> : <span className="text-4xl">&#x1F434;</span>}
                <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"><Camera className="h-3 w-3" /></div>
              </button>
              <span className="text-xs text-white/60">Tippen um Foto hinzuzufuegen</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              <span className="text-xs text-white/40">max. 5 MB</span>
              {photoError && <span className="text-xs text-red-400">{photoError}</span>}
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
            <div className="rounded-xl border border-white/15 p-3 space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Tierarzt</p>
              <div><label className={lc}>Name</label><input className={ic} value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="Dr. Mustermann" /></div>
              <div><label className={lc}>Telefon</label><input className={ic} value={vetPhone} onChange={(e) => setVetPhone(e.target.value)} placeholder="+49 ..." type="tel" /></div>
            </div>
            <div className="rounded-xl border border-white/15 p-3 space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Hufschmied</p>
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
          <button onClick={handleSave} disabled={saving || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl glass-btn-primary py-3 text-sm font-semibold transition-opacity disabled:opacity-50 touch-target">
            {saving ? "Wird gespeichert..." : "🐴 Pferd anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HorseCard({ horse }: { horse: Horse }) {
  const navigate = useNavigate();
  const statusLabel = horse.reha_status === "active" ? "In Reha" : horse.reha_status === "completed" ? "Abgeschlossen" : null;
  const statusClass = horse.reha_status === "active" ? "bg-reha/10 text-reha" : horse.reha_status === "completed" ? "bg-success/10 text-success" : "";
  return (
    <button
      onClick={() => navigate({ to: "/horse", search: { selected: horse.id } })}
      className="flex w-full items-center gap-3 rounded-xl p-3 card-equi transition-colors hover:bg-muted/50 touch-target text-left"
    >
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-linen">
        {horse.photo_url ? <img src={horse.photo_url} alt={horse.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl">&#x1F434;</div>}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{horse.name}</p>
        <p className="text-xs text-muted-foreground">{horse.breed ?? "Rasse unbekannt"}</p>
      </div>
      <div className="flex items-center gap-2">
        {statusLabel && <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", statusClass)}>{statusLabel}</span>}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function FeedbackModal({ userId, horses, onClose, onSent }: {
  userId: string;
  horses: Horse[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [horseId, setHorseId] = useState<string>(horses.length === 1 ? horses[0].id : "");
  const [sending, setSending] = useState(false);
  const [horseError, setHorseError] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return;
    // Horse is mandatory if user has horses
    if (horses.length > 0 && !horseId) {
      setHorseError("Bitte wähle ein Pferd aus.");
      return;
    }
    setHorseError("");
    setSending(true);
    const { error } = await supabase.from("feedback_messages").insert({
      user_id: userId,
      horse_id: horseId || null,
      title: title.trim(),
      content: content.trim(),
    });
    if (error) {
      console.error("Feedback error:", error);
      toast.error("Nachricht konnte nicht gesendet werden: " + error.message);
    } else {
      toast.success("Nachricht wurde an Laura gesendet! ✉️");
      onSent();
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl glass-modal flex flex-col" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Feedback an Laura</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target"><X className="h-5 w-5 text-white/60" /></button>
        </div>
        <div className="overflow-y-auto px-6 space-y-4 flex-1">
          <p className="text-xs text-white/50">Schreib Laura eine Nachricht – sie wird direkt in ihrem Admin-Bereich angezeigt.</p>

          {horses.length > 0 && (
            <div>
              <label className="text-xs font-medium text-white/60">Pferd auswählen *</label>
              <select
                className="mt-1 form-input-glass"
                value={horseId}
                onChange={(e) => { setHorseId(e.target.value); setHorseError(""); }}
              >
                <option value="">-- Pferd wählen --</option>
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>🐴 {h.name}</option>
                ))}
              </select>
              {horseError && <p className="mt-1 text-xs text-red-400">{horseError}</p>}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-white/60">Betreff *</label>
            <input
              className="mt-1 form-input-glass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Frage zur Therapie"
            />
          </div>

          <div className="pb-2">
            <label className="text-xs font-medium text-white/60">Nachricht *</label>
            <textarea
              className="mt-1 form-input-glass resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Deine Nachricht an Laura..."
              rows={5}
            />
          </div>
        </div>
        <div className="px-6 py-4 flex-shrink-0">
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !content.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl glass-btn-primary py-3 text-sm font-semibold transition-opacity disabled:opacity-50 touch-target"
          >
            <Save className="h-4 w-4" />
            {sending ? "Wird gesendet..." : "Nachricht senden"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpressumDatenschutzModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl glass-modal flex flex-col" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Impressum & Datenschutz</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target"><X className="h-5 w-5 text-white/60" /></button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 space-y-6 text-sm text-white/80 leading-relaxed">
          {/* Impressum */}
          <div>
            <h3 className="text-base font-semibold text-white mb-2">Impressum</h3>
            <div className="rounded-xl border border-white/15 p-3 space-y-1">
              <p className="font-medium text-white">Laura Kupka – EquiSanum</p>
              <p>Bewegungstherapie & Pferdetherapie</p>
              <p>Wolfersdorf bei Freising, Bayern</p>
              <p>E-Mail: info@equisanum.de</p>
            </div>
            <p className="mt-2 text-xs text-white/50">
              Angaben gemäß § 5 TMG. Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Laura Kupka.
            </p>
          </div>

          <hr className="border-white/10" />

          {/* Datenschutz */}
          <div>
            <h3 className="text-base font-semibold text-white mb-2">Datenschutzerklärung</h3>
            <p className="text-xs text-white/50 mb-3">Stand: April 2026</p>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">1. Verantwortliche Stelle</h4>
            <p>Verantwortlich für die Verarbeitung personenbezogener Daten im Sinne der DSGVO ist Laura Kupka – EquiSanum, Wolfersdorf bei Freising. Kontakt: info@equisanum.de</p>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">2. Erhobene Daten</h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Name und E-Mail-Adresse (bei Anmeldung über Google oder Apple)</li>
              <li>Profilbild (sofern vom Anbieter übertragen)</li>
              <li>Von dir eingegebene Inhalte (Pferdeprofile, Tagebucheinträge, Community-Beiträge)</li>
              <li>Technische Zugriffsdaten (IP-Adresse, Geräteinformationen, Zeitstempel)</li>
            </ul>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">3. Zweck der Verarbeitung</h4>
            <p>Deine Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet:</p>
            <ul className="list-disc list-inside space-y-1 text-white/70 mt-1">
              <li>Authentifizierung und Verwaltung deines Nutzerkontos</li>
              <li>Speicherung und Anzeige deiner Pferde- und Therapiedaten</li>
              <li>Betrieb und Verbesserung der Anwendung</li>
            </ul>
            <p className="mt-1">Eine Weitergabe an Dritte erfolgt nicht, außer sie ist zur Erbringung des Dienstes technisch erforderlich (z.B. Hosting-Anbieter).</p>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">4. Drittanbieter-Dienste</h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li><span className="text-white">Supabase</span> – Datenbank & Authentifizierung (Server in der EU)</li>
              <li><span className="text-white">Google OAuth</span> – optionale Anmeldemethode</li>
              <li><span className="text-white">Apple Sign In</span> – optionale Anmeldemethode</li>
            </ul>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">5. Speicherdauer</h4>
            <p>Deine Daten werden so lange gespeichert, wie dein Konto aktiv ist. Nach Löschung deines Kontos werden alle personenbezogenen Daten innerhalb von 30 Tagen unwiderruflich entfernt.</p>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">6. Deine Rechte (DSGVO)</h4>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Auskunft über gespeicherte Daten (Art. 15)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16)</li>
              <li>Löschung deiner Daten (Art. 17)</li>
              <li>Einschränkung der Verarbeitung (Art. 18)</li>
              <li>Datenübertragbarkeit (Art. 20)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
            </ul>
            <p className="mt-1">Zur Ausübung deiner Rechte: info@equisanum.de</p>

            <h4 className="font-semibold text-white/90 mt-4 mb-1">7. Beschwerderecht</h4>
            <p>Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HilfeFaqModal({ onClose }: { onClose: () => void }) {
  const faqs = [
    { q: "Was ist EquiSanum?", a: "EquiSanum ist deine App für Bewegungstherapie und Pferdetherapie. Hier verwaltest du deine Pferde, führst Therapie-Tagebücher und bleibst mit der Community in Kontakt." },
    { q: "Wie lege ich ein Pferd an?", a: "Gehe zu 'Mein Profil' und tippe auf '+ Pferd hinzufügen'. Gib Name, Rasse und weitere Infos ein. Du kannst auch ein Foto hochladen." },
    { q: "Was ist das Tagebuch?", a: "Im Tagebuch dokumentierst du Training, positive Momente und Veränderungen deines Pferdes. Jeder Eintrag ist einem Pferd zugeordnet und kann optional Fotos enthalten." },
    { q: "Was bedeuten die Tagebuch-Tabs?", a: "📓 Tagebuch = Trainingseinheiten & Alltag. ✨ Positiv = Schöne Fortschritte & Erfolge. 👁️ Veränderungen = Auffälligkeiten & Beobachtungen, die ggf. Laura sehen soll." },
    { q: "Was ist die Galerie bei 'Mein Pferd'?", a: "In der Galerie kannst du Fotos deines Pferdes speichern – z.B. Fortschrittsfotos, Behandlungsbilder oder einfach schöne Momente." },
    { q: "Was ist die Community?", a: "Hier kannst du Beiträge teilen, Fragen stellen und dich mit anderen Pferdebesitzern austauschen. Du kannst auch Fotos an Beiträge anhängen." },
    { q: "Wer ist Laura?", a: "Laura Kupka ist Bewegungstherapeutin und Pferdetherapeutin in Wolfersdorf bei Freising. Sie betreut die Reha-Pläne und kann deine Tagebucheinträge einsehen, wenn du es erlaubst." },
    { q: "Wie kann ich mein Profil bearbeiten?", a: "Tippe auf 'Profil bearbeiten' oben auf der Profilseite. Dort kannst du Name, Telefon, Bio und Profilbild ändern." },
    { q: "Sind meine Daten sicher?", a: "Ja! Alle Daten werden verschlüsselt auf europäischen Servern gespeichert (Supabase). Nur du und – bei Freigabe – Laura haben Zugriff auf deine Einträge." },
    { q: "Wie kann ich meinen Account löschen?", a: "Kontaktiere uns unter info@equisanum.de. Deine Daten werden innerhalb von 30 Tagen vollständig gelöscht." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl glass-modal flex flex-col" style={{ maxHeight: "85dvh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-heading text-lg font-bold text-white">Hilfe / FAQ</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 touch-target"><X className="h-5 w-5 text-white/60" /></button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-white/50 text-center">Weitere Fragen? Schreib uns an info@equisanum.de</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left touch-target">
        <span className="text-sm font-medium text-white pr-2">{question}</span>
        <ChevronRight className={cn("h-4 w-4 text-white/40 flex-shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-4 pb-3">
          <p className="text-sm text-white/70 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
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