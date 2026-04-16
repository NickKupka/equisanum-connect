import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/images/logo.png";
import { X } from "lucide-react";

export function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dsOpen, setDsOpen] = useState(false);

  const handleSignIn = async (provider: "google" | "apple") => {
    setLoading(provider);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setError("Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
      }
    } catch {
      setError("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
    } finally {
      setLoading(null);
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
      {/* subtle radial glow top-right */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 10%, oklch(0.55 0.12 280 / 0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 90%, oklch(0.45 0.10 220 / 0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo & Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
            <img src={logo} alt="EquiSanum Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white drop-shadow">
            EquiSanum
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Bewegungstherapie & Pferdetherapie
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            Laura Kupka · Wolfersdorf bei Freising
          </p>
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <p className="text-base font-medium text-white">
            Willkommen
          </p>
          <p className="mt-1 text-sm text-white/65">
            Melde dich an, um auf deine Pferde, Tagebücher und mehr zuzugreifen.
          </p>
        </div>

        {/* Sign In Buttons — glass style */}
        <div className="space-y-3">
          <button
            onClick={() => handleSignIn("google")}
            disabled={loading !== null}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-50 touch-target"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {loading === "google" ? "Wird angemeldet…" : "Mit Google anmelden"}
          </button>

          <button
            onClick={() => handleSignIn("apple")}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-50 touch-target"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            {loading === "apple" ? "Wird angemeldet…" : "Mit Apple anmelden"}
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-red-300">{error}</p>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-white/45">
          Mit der Anmeldung akzeptierst du unsere{" "}
          <button onClick={() => setDsOpen(true)} className="text-white/70 underline underline-offset-2 hover:text-white transition-colors">
            Datenschutzrichtlinie
          </button>.
        </p>
      </div>

      {dsOpen && <LoginDatenschutzModal onClose={() => setDsOpen(false)} />}
    </div>
  );
}

function LoginDatenschutzModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ maxHeight: "85dvh", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Datenschutzerklärung</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10"><X className="h-5 w-5 text-white/60" /></button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 space-y-4 text-sm text-white/80 leading-relaxed">
          <p className="text-xs text-white/50">Stand: April 2026</p>

          <div>
            <h3 className="font-semibold text-white mb-1">1. Verantwortliche Stelle</h3>
            <div className="rounded-xl border border-white/15 p-3 space-y-0.5">
              <p className="font-medium text-white">Laura Kupka – EquiSanum</p>
              <p>Wolfersdorf bei Freising, Bayern</p>
              <p>Kontakt: info@equisanum.de</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-1">2. Erhobene Daten</h3>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Name und E-Mail-Adresse (bei Anmeldung über Google oder Apple)</li>
              <li>Profilbild (sofern vom Anbieter übertragen)</li>
              <li>Von dir eingegebene Inhalte (Pferdeprofile, Tagebucheinträge, Community-Beiträge)</li>
              <li>Technische Zugriffsdaten (IP-Adresse, Geräteinformationen, Zeitstempel)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-1">3. Zweck der Verarbeitung</h3>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Authentifizierung und Verwaltung deines Nutzerkontos</li>
              <li>Speicherung und Anzeige deiner Pferde- und Therapiedaten</li>
              <li>Betrieb und Verbesserung der Anwendung</li>
            </ul>
            <p className="mt-1">Keine Weitergabe an Dritte, außer technisch erforderlich (Hosting).</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-1">4. Drittanbieter</h3>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li><span className="text-white">Supabase</span> – Datenbank & Auth (EU-Server)</li>
              <li><span className="text-white">Google OAuth</span> – optionale Anmeldung</li>
              <li><span className="text-white">Apple Sign In</span> – optionale Anmeldung</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-1">5. Speicherdauer</h3>
            <p>Daten werden gespeichert solange dein Konto aktiv ist. Nach Löschung werden alle Daten innerhalb von 30 Tagen entfernt.</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-1">6. Deine Rechte (DSGVO)</h3>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17)</li>
              <li>Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20)</li>
              <li>Widerspruch (Art. 21)</li>
            </ul>
            <p className="mt-1">Kontakt: info@equisanum.de</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-1">7. Beschwerderecht</h3>
            <p>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.</p>
          </div>
        </div>
      </div>
    </div>
  );
}