-- Feedback messages from users to Laura (admin)
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

-- Users can create feedback messages
DO $$ BEGIN
  CREATE POLICY "Users can create feedback" ON public.feedback_messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users can view their own messages
DO $$ BEGIN
  CREATE POLICY "Users can view own feedback" ON public.feedback_messages
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin can view and manage all messages
DO $$ BEGIN
  CREATE POLICY "Admin can manage feedback" ON public.feedback_messages
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

SELECT 'Feedback messages table created!' AS result;
