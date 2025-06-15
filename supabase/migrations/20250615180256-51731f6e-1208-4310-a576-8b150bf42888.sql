
-- Add category column to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN category TEXT;

-- Update existing items to have the category 'Klær'
UPDATE public.inventory_items
SET category = 'Klær'
WHERE category IS NULL;
