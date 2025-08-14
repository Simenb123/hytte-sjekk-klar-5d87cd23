-- Create locations table for storing favorite places
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to locations
CREATE POLICY "Public read access to locations" 
ON public.locations 
FOR SELECT 
USING (true);

-- Create policies for authenticated users to manage locations
CREATE POLICY "Authenticated users can create locations" 
ON public.locations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations" 
ON public.locations 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete locations" 
ON public.locations 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Insert default locations
INSERT INTO public.locations (name, latitude, longitude, is_default) VALUES
('Gaustablikk, Tinn', 59.8726, 8.6475, true),
('Oslo, Norge', 59.9139, 10.7522, true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();