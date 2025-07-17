-- Add policy to allow authenticated users to view all profiles for family member linking
CREATE POLICY "Authenticated users can view all profiles for family linking" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');