-- 1) Fix RLS: allow admin to insert reha_updates for any horse
CREATE POLICY "admin_insert_reha_updates"
  ON reha_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR auth.uid() = created_by
  );

-- Also allow admin to read all reha_updates
CREATE POLICY "admin_select_reha_updates"
  ON reha_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
    OR auth.uid() = created_by
  );

-- 2) News posts table
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

-- Everyone can read active news
CREATE POLICY "anyone_read_active_news" ON news_posts FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admin can do everything
CREATE POLICY "admin_insert_news" ON news_posts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin_update_news" ON news_posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "admin_delete_news" ON news_posts FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- 3) News reactions (emoji reactions from users)
CREATE TABLE IF NOT EXISTS news_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  emoji text NOT NULL DEFAULT '👍',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id, emoji)
);

ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_reactions" ON news_reactions FOR SELECT USING (true);
CREATE POLICY "user_insert_reaction" ON news_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_delete_reaction" ON news_reactions FOR DELETE USING (auth.uid() = user_id);

-- 4) News messages (direct messages from users to admin about a news post)
CREATE TABLE IF NOT EXISTS news_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own messages
CREATE POLICY "user_insert_news_message" ON news_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can read their own, admin can read all
CREATE POLICY "read_news_messages" ON news_messages FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));
-- Admin can mark as read
CREATE POLICY "admin_update_news_messages" ON news_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
