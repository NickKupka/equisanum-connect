-- ============================================================
-- RUN THIS IN SUPABASE DASHBOARD → SQL EDITOR
-- Fixes: reha_updates RLS, horse sharing columns, news system
-- ============================================================

-- ============ 0) VERIFY ADMIN ROLE EXISTS ============
-- Make sure your admin user has the 'admin' role
-- Replace the email below if needed
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'nick.kupka@gmail.com';
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'admin')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Admin role ensured for %', admin_uid;
  ELSE
    RAISE WARNING 'Admin user not found!';
  END IF;
END $$;

-- ============ 1) FIX has_role TO BE SECURITY DEFINER ============
-- This ensures RLS policies using has_role() work correctly
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ 2) HORSE SHARING COLUMNS ============
ALTER TABLE horses ADD COLUMN IF NOT EXISTS share_diary boolean NOT NULL DEFAULT false;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS share_positive boolean NOT NULL DEFAULT false;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS share_changes boolean NOT NULL DEFAULT false;

-- ============ 3) NEWS POSTS TABLE ============
CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anyone_read_active_news" ON news_posts FOR SELECT
    USING (is_active = true OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_insert_news" ON news_posts FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_update_news" ON news_posts FOR UPDATE
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_delete_news" ON news_posts FOR DELETE
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 4) NEWS REACTIONS TABLE ============
CREATE TABLE IF NOT EXISTS news_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  emoji text NOT NULL DEFAULT '👍',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id, emoji)
);

ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anyone_read_reactions" ON news_reactions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "user_insert_reaction" ON news_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "user_delete_reaction" ON news_reactions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 5) NEWS MESSAGES TABLE ============
CREATE TABLE IF NOT EXISTS news_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_insert_news_message" ON news_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "read_news_messages" ON news_messages FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "admin_update_news_messages" ON news_messages FOR UPDATE
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 6) CREATE STORAGE BUCKET FOR NEWS IMAGES ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('news', 'news', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admin to upload to news bucket
DO $$ BEGIN
  CREATE POLICY "admin_upload_news" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'news' AND EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Allow public read of news images
DO $$ BEGIN
  CREATE POLICY "public_read_news" ON storage.objects FOR SELECT
    USING (bucket_id = 'news');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ 7) FIX MEDIA BUCKET: ADD MISSING UPDATE + DELETE POLICIES ============
-- Without these, users cannot change horse photos or delete gallery images
DO $$ BEGIN
  CREATE POLICY "Auth can update own media" ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth can delete own media" ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Also add update + delete for the horses bucket (same issue)
DO $$ BEGIN
  CREATE POLICY "Auth can update own horse media" ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'horses' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth can delete own horse media" ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'horses' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ DONE ============
SELECT 'All migrations applied successfully! 🎉' as result;
