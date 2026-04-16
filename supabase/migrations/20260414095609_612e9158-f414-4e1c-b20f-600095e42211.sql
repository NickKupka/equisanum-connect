
-- ========== REHA UPDATES ==========
CREATE TABLE public.reha_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID REFERENCES public.horses(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT,
  content TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  mood TEXT CHECK (mood IN ('sad', 'neutral', 'ok', 'good', 'great')),
  category TEXT CHECK (category IN ('training', 'therapy', 'analysis', 'relaxation', 'general')),
  visibility TEXT NOT NULL DEFAULT 'owner' CHECK (visibility IN ('owner', 'community')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reha_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Horse owners can view reha updates" ON public.reha_updates FOR SELECT USING (EXISTS (SELECT 1 FROM public.horses WHERE horses.id = reha_updates.horse_id AND horses.owner_id = auth.uid()));
CREATE POLICY "Admin can manage reha updates" ON public.reha_updates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_reha_updates_updated_at BEFORE UPDATE ON public.reha_updates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== DIARY ENTRIES ==========
CREATE TABLE public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES public.horses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER,
  content TEXT,
  user_mood TEXT,
  horse_mood TEXT,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  visible_to_admin BOOLEAN NOT NULL DEFAULT true,
  training_plan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diary" ON public.diary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert diary" ON public.diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update diary" ON public.diary_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete diary" ON public.diary_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view visible diary" ON public.diary_entries FOR SELECT USING (public.has_role(auth.uid(), 'admin') AND visible_to_admin = true);
CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== POSITIVE ENTRIES ==========
CREATE TABLE public.positive_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES public.horses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  category TEXT,
  photo_url TEXT,
  video_url TEXT,
  visible_to_admin BOOLEAN NOT NULL DEFAULT true,
  share_in_community BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.positive_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own positive" ON public.positive_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert positive" ON public.positive_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update positive" ON public.positive_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete positive" ON public.positive_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view visible positive" ON public.positive_entries FOR SELECT USING (public.has_role(auth.uid(), 'admin') AND visible_to_admin = true);
CREATE TRIGGER update_positive_entries_updated_at BEFORE UPDATE ON public.positive_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CHANGE ENTRIES ==========
CREATE TABLE public.change_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES public.horses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  body_area TEXT,
  category TEXT,
  since_when TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  notify_admin BOOLEAN NOT NULL DEFAULT false,
  admin_feedback TEXT,
  admin_feedback_type TEXT,
  visible_to_admin BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.change_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own changes" ON public.change_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert changes" ON public.change_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update changes" ON public.change_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete changes" ON public.change_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage changes" ON public.change_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_change_entries_updated_at BEFORE UPDATE ON public.change_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== TRAINING PLANS ==========
CREATE TABLE public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'structured' CHECK (plan_type IN ('structured', 'pdf')),
  content JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage plans" ON public.training_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.training_plan_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
  horse_id UUID REFERENCES public.horses(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  note TEXT,
  valid_from DATE,
  valid_until DATE,
  progress JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_plan_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage assignments" ON public.training_plan_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Horse owners can view assignments" ON public.training_plan_assignments FOR SELECT USING (EXISTS (SELECT 1 FROM public.horses WHERE horses.id = training_plan_assignments.horse_id AND horses.owner_id = auth.uid()));

CREATE POLICY "Users can view assigned plans" ON public.training_plans FOR SELECT USING (EXISTS (SELECT 1 FROM public.training_plan_assignments tpa JOIN public.horses h ON h.id = tpa.horse_id WHERE tpa.plan_id = training_plans.id AND h.owner_id = auth.uid()));

CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON public.training_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tpa_updated_at BEFORE UPDATE ON public.training_plan_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== KNOWLEDGE ARTICLES ==========
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'reha_only', 'draft')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage articles" ON public.knowledge_articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view published articles" ON public.knowledge_articles FOR SELECT TO authenticated USING (visibility = 'all' OR (visibility = 'reha_only' AND EXISTS (SELECT 1 FROM public.horses WHERE owner_id = auth.uid() AND reha_status = 'active')));
CREATE TRIGGER update_knowledge_articles_updated_at BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.article_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES public.knowledge_articles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);
ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON public.article_bookmarks FOR ALL USING (auth.uid() = user_id);

-- ========== COMMUNITY ==========
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  horse_id UUID REFERENCES public.horses(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view visible posts" ON public.community_posts FOR SELECT TO authenticated USING (is_hidden = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage all posts" ON public.community_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view visible comments" ON public.community_comments FOR SELECT TO authenticated USING (is_hidden = false);
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage comments" ON public.community_comments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'clap', 'idea', 'horse')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction_type)
);
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reactions" ON public.community_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add reactions" ON public.community_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.community_reactions FOR DELETE USING (auth.uid() = user_id);

-- ========== ANNOUNCEMENTS ==========
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'reha_only')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view announcements" ON public.announcements FOR SELECT TO authenticated USING ((valid_from IS NULL OR valid_from <= now()) AND (valid_until IS NULL OR valid_until >= now()));
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== OBSERVATION PROMPTS ==========
CREATE TABLE public.observation_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.observation_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage prompts" ON public.observation_prompts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active prompts" ON public.observation_prompts FOR SELECT TO authenticated USING (is_active = true);

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can create notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('horses', 'horses', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Auth can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Auth can upload horse media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'horses' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view horse media" ON storage.objects FOR SELECT USING (bucket_id = 'horses');

CREATE POLICY "Auth can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- ========== DEFAULT DATA ==========
INSERT INTO public.observation_prompts (text) VALUES
  ('Hast du heute die Hufe deines Pferdes angeschaut? 🦶'),
  ('Wie steht dein Pferd gerade? Gleichmäßig auf allen vier Beinen? 👀'),
  ('Fühlt sich das Fell heute anders an als sonst?'),
  ('Reagiert dein Pferd heute anders auf Berührung an der Schulter?'),
  ('Wie ist der Schwung im Schritt heute? Gleichmäßig?'),
  ('Gibt dein Pferd alle vier Hufe problemlos? 🤔'),
  ('Wie riecht das Heu heute? Muffig? Frisch?'),
  ('Hat dein Pferd heute normal gefressen und getrunken?'),
  ('Wie ist die Muskulatur am Hals? Symmetrisch?'),
  ('Schaut dein Pferd dich heute anders an?');
