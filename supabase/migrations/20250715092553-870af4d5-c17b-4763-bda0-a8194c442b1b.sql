-- Create wine_cellar table for wine storage management
CREATE TABLE public.wine_cellar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  vintage TEXT,
  producer TEXT,
  grape_variety TEXT,
  wine_color TEXT CHECK (wine_color IN ('red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified')),
  alcohol_percentage DECIMAL(4,2),
  bottle_count INTEGER NOT NULL DEFAULT 1 CHECK (bottle_count >= 0),
  location TEXT NOT NULL DEFAULT 'Hjemme',
  purchase_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  purchase_info TEXT,
  purchase_date DATE,
  consumed_date DATE,
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 6),
  tasting_notes TEXT,
  serving_notes TEXT,
  consumed_with TEXT,
  vinmonopol_id TEXT,
  vinmonopol_url TEXT,
  image_url TEXT,
  description TEXT,
  country TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wine_cellar ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own wines" 
ON public.wine_cellar 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wines" 
ON public.wine_cellar 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wines" 
ON public.wine_cellar 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wines" 
ON public.wine_cellar 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_wine_cellar_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wine_cellar_updated_at
BEFORE UPDATE ON public.wine_cellar
FOR EACH ROW
EXECUTE FUNCTION public.update_wine_cellar_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_wine_cellar_user_id ON public.wine_cellar(user_id);
CREATE INDEX idx_wine_cellar_location ON public.wine_cellar(location);
CREATE INDEX idx_wine_cellar_wine_color ON public.wine_cellar(wine_color);
CREATE INDEX idx_wine_cellar_is_consumed ON public.wine_cellar(is_consumed);
CREATE INDEX idx_wine_cellar_rating ON public.wine_cellar(rating);
CREATE INDEX idx_wine_cellar_vinmonopol_id ON public.wine_cellar(vinmonopol_id);