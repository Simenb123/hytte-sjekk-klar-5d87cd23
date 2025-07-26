-- Add primary_location enum type
CREATE TYPE primary_location_enum AS ENUM ('hjemme', 'hytta', 'reiser');

-- Add primary_location column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN primary_location primary_location_enum DEFAULT 'hjemme';

-- Update existing items to have a primary location based on current location text
UPDATE public.inventory_items 
SET primary_location = CASE 
  WHEN LOWER(location) LIKE '%hytt%' THEN 'hytta'::primary_location_enum
  WHEN LOWER(location) LIKE '%hjem%' THEN 'hjemme'::primary_location_enum
  WHEN LOWER(location) LIKE '%reise%' OR LOWER(location) LIKE '%bag%' THEN 'reiser'::primary_location_enum
  ELSE 'hjemme'::primary_location_enum
END;

-- Make primary_location NOT NULL after setting default values
ALTER TABLE public.inventory_items 
ALTER COLUMN primary_location SET NOT NULL;