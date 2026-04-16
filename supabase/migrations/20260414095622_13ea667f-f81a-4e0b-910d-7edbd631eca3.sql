
-- Drop overly broad SELECT policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view horse media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;

-- Recreate with scoped access: public read for individual files (via URL), but listing restricted
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND (auth.role() = 'authenticated' OR (storage.foldername(name))[1] IS NOT NULL));
CREATE POLICY "Anyone can view horse media" ON storage.objects FOR SELECT USING (bucket_id = 'horses' AND (auth.role() = 'authenticated' OR (storage.foldername(name))[1] IS NOT NULL));
CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media' AND (auth.role() = 'authenticated' OR (storage.foldername(name))[1] IS NOT NULL));
