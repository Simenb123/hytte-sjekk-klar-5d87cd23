
-- Create facilities table
CREATE TABLE public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- cooking, tools, entertainment, other
  description TEXT,
  icon_url TEXT,
  is_seasonal BOOLEAN DEFAULT false,
  season TEXT, -- winter, summer, all
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_facilities_used table to track which facilities are used per booking
CREATE TABLE public.booking_facilities_used (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, facility_id, user_id)
);

-- Add facility_id to checklist_items to connect items to facilities
ALTER TABLE public.checklist_items 
ADD COLUMN facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_facilities_used ENABLE ROW LEVEL SECURITY;

-- RLS policies for facilities (read-only for authenticated users, admin can modify)
CREATE POLICY "Authenticated users can view facilities" 
  ON public.facilities 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create facilities" 
  ON public.facilities 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update facilities" 
  ON public.facilities 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete facilities" 
  ON public.facilities 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- RLS policies for booking_facilities_used
CREATE POLICY "Users can view their own facility usage" 
  ON public.booking_facilities_used 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own facility usage" 
  ON public.booking_facilities_used 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facility usage" 
  ON public.booking_facilities_used 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facility usage" 
  ON public.booking_facilities_used 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert initial facilities based on your examples
INSERT INTO public.facilities (name, category, description, is_seasonal, season) VALUES
-- Matlaging
('Pizzaovn', 'cooking', 'Utendørs pizzaovn for steking av pizza og brød', false, 'all'),
('Grill', 'cooking', 'Gasgrill for utendørs matlaging', true, 'summer'),
('Isbitmaskin', 'cooking', 'Automatisk isbitmaskin i kjøkkenet', false, 'all'),

-- Redskaper
('Snøfreser', 'tools', 'Elektrisk snøfreser for rydding av snø', true, 'winter'),
('Kantklipper', 'tools', 'Gresskantklipper for hagearbeid', true, 'summer'),
('Vedkløyver', 'tools', 'Hydraulisk vedkløyver for kapping av ved', false, 'all'),
('Støvsuger', 'tools', 'Sentralstøvsuger og vanlig støvsuger', false, 'all'),

-- Fornøyelse
('Boblebad', 'entertainment', 'Utendørs boblebad/spa med smart styring', false, 'all'),
('Auroraplassen', 'entertainment', 'Utendørs plass for nordlys-observasjon', true, 'winter'),
('TV og underholdning', 'entertainment', 'Smart TV med streaming-tjenester', false, 'all'),

-- Annet
('Ladeboks elbil', 'other', 'Type 2 ladeboks for elektriske biler', false, 'all');

-- Update existing checklist items to connect to facilities
-- Connect boblebad items
UPDATE public.checklist_items 
SET facility_id = (SELECT id FROM public.facilities WHERE name = 'Boblebad')
WHERE area_id IN (SELECT id FROM public.areas WHERE LOWER(name) LIKE '%boblebad%' OR LOWER(name) LIKE '%spa%');

-- Connect grill items  
UPDATE public.checklist_items 
SET facility_id = (SELECT id FROM public.facilities WHERE name = 'Grill')
WHERE area_id IN (SELECT id FROM public.areas WHERE LOWER(name) LIKE '%grill%');

-- Connect pizza oven items
UPDATE public.checklist_items 
SET facility_id = (SELECT id FROM public.facilities WHERE name = 'Pizzaovn')
WHERE area_id IN (SELECT id FROM public.areas WHERE LOWER(name) LIKE '%pizza%');
