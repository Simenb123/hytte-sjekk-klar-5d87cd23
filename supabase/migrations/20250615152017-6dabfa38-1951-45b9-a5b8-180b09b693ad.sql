
-- Create a table for inventory items
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id)
);

-- Add Row Level Security (RLS) for inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_items
CREATE POLICY "Authenticated users can view inventory items"
  ON public.inventory_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own inventory items"
  ON public.inventory_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON public.inventory_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON public.inventory_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a table for item images
CREATE TABLE public.item_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id)
);

-- Add RLS for item_images
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

-- Policies for item_images
CREATE POLICY "Authenticated users can view item images"
  ON public.item_images
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own item images"
  ON public.item_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item images"
  ON public.item_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a join table for owners
CREATE TABLE public.owner_assignments (
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, profile_id)
);

-- Add RLS for owner_assignments
ALTER TABLE public.owner_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for owner_assignments
CREATE POLICY "Authenticated users can manage owner assignments"
  ON public.owner_assignments
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create a storage bucket for inventory images
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory_images', 'inventory_images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage bucket
CREATE POLICY "Authenticated users can view inventory images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload inventory images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own inventory images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'inventory_images' AND auth.uid() = owner);

CREATE POLICY "Users can update their own inventory images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'inventory_images' AND auth.uid() = owner);
