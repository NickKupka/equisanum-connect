-- Add riding share field to horses
ALTER TABLE public.horses ADD COLUMN IF NOT EXISTS riding_share TEXT;

-- Create storage buckets for user avatars and horse photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('horse-photos', 'horse-photos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS for avatars bucket
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- RLS for horse-photos bucket
CREATE POLICY "Users can upload horse photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'horse-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update horse photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'horse-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view horse photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'horse-photos');
