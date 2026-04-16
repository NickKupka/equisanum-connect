import { Link } from "@tanstack/react-router";

export function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </Link>

        <article className="prose prose-neutral max-w-none">
          <h1 className="text-2xl font-bold text-foreground">Datenschutzerklärung</h1>
          <p className="text-sm text-muted-foreground">Stand: April 2026</p>

          <hr className="my-6 border-border" />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Verantwortliche Stelle</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Verantwortlich für die Verarbeitung personenbezogener Daten im Sinne der
              Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground leading-relaxed">
              <p className="font-medium">Laura Kupka – EquiSanum</p>
              <p className="text-muted-foreground">Wolfersdorf bei Freising, Bayern</p>
              <p className="text-muted-foreground">Kontakt: info@equisanum.de</p>
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">2. Erhobene Daten</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bei der Nutzung dieser App werden folgende personenbezogene Daten verarbeitet:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside leading-relaxed">
              <li>Name und E-Mail-Adresse (bei Anmeldung über Google oder Apple)</li>
              <li>Profilbild (sofern vom gewählten Anbieter übertragen)</li>
              <li>Von dir eingegebene Inhalte (Pferdeprofile, Tagebucheinträge etc.)</li>
              <li>Technische Zugriffsdaten (IP-Adresse, Geräteinformationen, Zeitstempel)</li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3. Zweck der Verarbeitung</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deine Daten werden ausschließlich zur Bereitstellung der App-Funktionen verwendet:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside leading-relaxed">
              <li>Authentifizierung und Verwaltung deines Nutzerkontos</li>
              <li>Speicherung und Anzeige deiner Pferde- und Therapiedaten</li>
              <li>Betrieb und Verbesserung der Anwendung</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Eine Weitergabe an Dritte erfolgt nicht, außer sie ist zur Erbringung des
              Dienstes technisch erforderlich (z. B. Hosting-Anbieter).
            </p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">4. Drittanbieter-Dienste</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Die App nutzt folgende externe Dienste:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside leading-relaxed">
              <li>
                <span className="font-medium text-foreground">Supabase</span> – Datenbankdienst und
                Authentifizierung (Server in der EU). Datenschutz:{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <span className="font-medium text-foreground">Google OAuth</span> – optionale
                Anmeldemethode. Datenschutz:{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  policies.google.com/privacy
                </a>
              </li>
              <li>
                <span className="font-medium text-foreground">Apple Sign In</span> – optionale
                Anmeldemethode. Datenschutz:{" "}
                <a
                  href="https://www.apple.com/de/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  apple.com/de/privacy
                </a>
              </li>
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">5. Speicherdauer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deine Daten werden so lange gespeichert, wie dein Konto aktiv ist. Nach
              Löschung deines Kontos werden alle personenbezogenen Daten innerhalb von
              30 Tagen unwiderruflich entfernt.
            </p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">6. Deine Rechte</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Du hast gemäß DSGVO folgende Rechte:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside leading-relaxed">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zur Ausübung deiner Rechte wende dich bitte an:{" "}
              <a
                href="mailto:info@equisanum.de"
                className="underline hover:text-foreground transition-colors"
              >
                info@equisanum.de
              </a>
            </p>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">7. Beschwerderecht</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
              Zuständig ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA),
              Promenade 18, 91522 Ansbach.
            </p>
          </section>
        </article>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
