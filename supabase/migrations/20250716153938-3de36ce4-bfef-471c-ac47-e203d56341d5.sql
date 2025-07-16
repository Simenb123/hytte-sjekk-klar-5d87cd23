-- Enable DELETE policy for authenticated users on cabin_documents
CREATE POLICY "Authenticated users can delete cabin documents" 
ON public.cabin_documents 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);