-- Add missing password_hash column to shared_media_links
ALTER TABLE public.shared_media_links 
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';