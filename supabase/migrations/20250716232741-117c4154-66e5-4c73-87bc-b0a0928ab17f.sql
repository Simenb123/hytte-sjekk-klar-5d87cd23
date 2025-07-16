-- Add front page image support to cabin documents
ALTER TABLE public.cabin_documents 
ADD COLUMN front_page_image_id UUID REFERENCES public.document_images(id) ON DELETE SET NULL;