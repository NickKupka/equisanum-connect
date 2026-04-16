-- Add per-horse sharing toggles so owners can decide what Laura sees
ALTER TABLE horses ADD COLUMN IF NOT EXISTS share_diary boolean NOT NULL DEFAULT false;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS share_positive boolean NOT NULL DEFAULT false;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS share_changes boolean NOT NULL DEFAULT false;
