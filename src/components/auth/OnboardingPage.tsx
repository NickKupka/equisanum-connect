import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, ArrowRight, X } from "lucide-react";

function parseNameFromEmail(email?: string | null): { first: string; last: string } {
  if (!email) return { first: "", last: "" };
  const local = email.split("@")[0] ?? "";
  // Try to split by dot, underscore, or dash
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      first: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      last: parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" "),
    };
  }
  if (parts.length === 1) {
    return { first: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(), last: "" };
  }
  return { first: "", last: "" };
}

export function OnboardingPage() {
  const { user, profile, refetchProfile } = useAuth();
  const navigate = useNavigate();

  // Derive names: prefer profile data, then parse from email
  const emailNames = parseNameFromEmail(user?.email);
  const [firstName, setFirstName] = useState(profile?.first_name || emailNames.first);
  const [lastName, setLastName] = useState(profile?.last_name || emailNames.last);
  const [phone, setPhone] = useState("");
  const [horseName, setHorseName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!user || !firstName.trim()) return;
    setSaving(true);
    try {
      // Update profile
      await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          onboarding_complete: true,
        })
        .eq("user_id", user.id);

      // Create horse if provided
      if (horseName.trim()) {
        await supabase.from("horses").insert({
          owner_id: user.id,
          name: horseName.trim(),
        });
      }

      refetchProfile?.();
      navigate({ to: "/" });
    } catch {
      // handle error silently
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.22 0.07 240) 0%, oklch(0.30 0.09 255) 40%, oklch(0.38 0.10 270) 70%, oklch(0.28 0.08 230) 100%)",
      }}
    >
      {/* subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 10%, oklch(0.55 0.12 280 / 0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 90%, oklch(0.45 0.10 220 / 0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-white drop-shadow">
            Willkommen bei EquiSanum! 🐴🌿
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Erzähl uns kurz von dir und deinem Pferd.
          </p>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <button className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/20 transition-colors hover:ring-white/40"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-8 w-8 text-white/40" />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5 text-center">
              <span className="text-[0.6rem] font-medium text-white/80">Foto</span>
            </div>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/60">
                Vorname *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Anna"
                className="mt-1 form-input-glass"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">
                Nachname
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Schneider"
                className="mt-1 form-input-glass"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/60">
              Telefonnummer (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 170 1234567"
              className="mt-1 form-input-glass"
            />
          </div>

          {/* Horse Quick Add */}
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🐴</span>
              <h3 className="text-sm font-semibold text-white">
                Dein Pferd
              </h3>
            </div>
            <p className="text-xs text-white/50">
              Du kannst weitere Details später hinzufügen.
            </p>
            <input
              type="text"
              value={horseName}
              onChange={(e) => setHorseName(e.target.value)}
              placeholder="Name deines Pferdes"
              className="mt-1 form-input-glass"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!firstName.trim() || saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-50 touch-target"
            style={{
              background: "rgba(255,255,255,0.14)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {saving ? "Wird gespeichert…" : "Los geht's! 🌿"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
          {!horseName && (
            <button
              onClick={() => {
                setHorseName("");
                handleSubmit();
              }}
              className="w-full text-center text-sm text-white/50 underline underline-offset-2 hover:text-white/70 transition-colors"
            >
              Pferd später hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
