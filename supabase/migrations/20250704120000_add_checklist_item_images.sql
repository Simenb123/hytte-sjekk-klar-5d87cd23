-- Create table for checklist item images
CREATE TABLE public.checklist_item_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.checklist_item_images ENABLE ROW LEVEL SECURITY;

-- Policies for checklist_item_images
CREATE POLICY "Authenticated users can view checklist item images"
  ON public.checklist_item_images
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own checklist item images"
  ON public.checklist_item_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist item images"
  ON public.checklist_item_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for checklist item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist_item_images', 'checklist_item_images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies in case they exist
DROP POLICY IF EXISTS "Authenticated users can view checklist item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload checklist item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own checklist item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own checklist item images" ON storage.objects;

-- Policies for the storage bucket
CREATE POLICY "Authenticated users can view checklist item images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'checklist_item_images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload checklist item images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'checklist_item_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own checklist item images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'checklist_item_images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own checklist item images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'checklist_item_images' AND auth.uid() = owner);
