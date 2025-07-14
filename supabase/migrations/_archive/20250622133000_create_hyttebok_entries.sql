-- Create table for cabin log entries
CREATE TABLE public.hyttebok_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.hyttebok_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view hyttebok entries"
  ON public.hyttebok_entries
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own hyttebok entries"
  ON public.hyttebok_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hyttebok entries"
  ON public.hyttebok_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hyttebok entries"
  ON public.hyttebok_entries
  FOR DELETE
  USING (auth.uid() = user_id);
