-- Reha entries table - Laura writes, customers read
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

-- Admin can do everything
DO $$ BEGIN
  CREATE POLICY "Admin can manage reha entries" ON public.reha_entries
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Horse owner can read reha entries for their horses
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

CREATE TRIGGER update_reha_entries_updated_at
  BEFORE UPDATE ON public.reha_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
