-- Create storage bucket for cabin document files
INSERT INTO storage.buckets (id, name, public)
VALUES ('document_files', 'document_files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "Authenticated users can view document files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own document files" ON storage.objects;

-- Policies controlling access to the bucket
CREATE POLICY "Authenticated users can view document files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'document_files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload document files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'document_files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own document files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'document_files' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own document files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'document_files' AND auth.uid() = owner);
