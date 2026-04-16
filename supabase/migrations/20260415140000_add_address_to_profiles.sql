-- Add address fields to profiles (visible only to user and admin Laura)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
