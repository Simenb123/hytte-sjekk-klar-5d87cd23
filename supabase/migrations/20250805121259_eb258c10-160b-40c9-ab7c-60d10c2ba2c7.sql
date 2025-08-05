-- Add height column to family_members table for better clothing size analysis
ALTER TABLE public.family_members 
ADD COLUMN height numeric(5,2);

-- Add comment to explain the height field
COMMENT ON COLUMN public.family_members.height IS 'Height in centimeters for clothing size analysis';