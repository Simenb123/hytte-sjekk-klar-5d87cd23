-- Ensure the text column exists on hyttebok_entries
ALTER TABLE public.hyttebok_entries
  ADD COLUMN IF NOT EXISTS text TEXT;
