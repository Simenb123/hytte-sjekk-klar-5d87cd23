
-- Drop existing policies for inventory_images bucket to avoid conflicts.
-- This is to ensure a clean setup and prevent errors if policies already exist.
DROP POLICY IF EXISTS "Authenticated users can view inventory images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inventory images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own inventory images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own inventory images" ON storage.objects;

-- Create storage bucket for inventory images if it doesn't exist.
-- This bucket will store the pictures of your inventory items.
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory_images', 'inventory_images', true)
ON CONFLICT (id) DO NOTHING;

-- Recreate policies for the storage bucket to control access.
-- These policies ensure that only authenticated users can manage images.
CREATE POLICY "Authenticated users can view inventory images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload inventory images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own inventory images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'inventory_images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own inventory images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'inventory_images' AND auth.uid() = owner);
