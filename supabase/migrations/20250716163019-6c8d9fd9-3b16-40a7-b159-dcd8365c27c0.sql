-- First create the function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create document_images table for storing multiple images per document
CREATE TABLE public.document_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.cabin_documents(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_images ENABLE ROW LEVEL SECURITY;

-- Create policies for document images
CREATE POLICY "Authenticated users can view document images" 
ON public.document_images 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create document images" 
ON public.document_images 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update document images" 
ON public.document_images 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete document images" 
ON public.document_images 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for updated_at
CREATE TRIGGER update_document_images_updated_at
BEFORE UPDATE ON public.document_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();