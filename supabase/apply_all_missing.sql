-- =============================================================================
-- EquiSanum: Alle fehlenden DB-Änderungen auf einmal anwenden
-- Dieses Script im Supabase SQL Editor (Dashboard → SQL Editor) ausführen
-- Alle Befehle sind idempotent (können mehrfach ausgeführt werden)
-- =============================================================================

-- ─── 1. Adress-Spalten in profiles ──────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- ─── 2. Feedback Messages Tabelle ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES public.horses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can create feedback" ON public.feedback_messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own feedback" ON public.feedback_messages
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin can manage feedback" ON public.feedback_messages
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 3. Reha Entries Tabelle ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reha_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID REFERENCES public.horses(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Allgemein',
  mood TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reha_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admin can manage reha entries" ON public.reha_entries
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner can view reha entries" ON public.reha_entries
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.horses
        WHERE horses.id = reha_entries.horse_id
        AND horses.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger nur erstellen wenn er noch nicht existiert
DO $$ BEGIN
  CREATE TRIGGER update_reha_entries_updated_at
    BEFORE UPDATE ON public.reha_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. Storage: UPDATE + DELETE Policies für media Bucket ─────────────────
-- Ohne UPDATE-Policy funktioniert upsert nicht (Foto ändern)
-- Ohne DELETE-Policy können Dateien nicht gelöscht werden
DO $$ BEGIN
  CREATE POLICY "Auth can update media" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth can delete media" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 5. Admin-Rolle für Laura sicherstellen ────────────────────────────────
-- (Wird nur eingefügt wenn noch kein Admin existiert für diese user_id)
-- Falls Laura's user_id bekannt ist, hier eintragen:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('HIER_LAURAS_USER_ID', 'admin')
-- ON CONFLICT DO NOTHING;

-- ─── Fertig ─────────────────────────────────────────────────────────────────
SELECT 'Alle Migrationen erfolgreich angewendet!' AS ergebnis;
