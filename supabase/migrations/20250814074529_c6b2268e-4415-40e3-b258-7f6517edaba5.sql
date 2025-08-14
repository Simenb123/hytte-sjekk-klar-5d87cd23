-- Create a secure function to get users for family linking
-- This replaces the overly permissive "view all profiles" policy
CREATE OR REPLACE FUNCTION public.get_users_for_family_linking()
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    p.id,
    CASE 
      WHEN TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) = '' 
      THEN 'Ukjent bruker'
      ELSE TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''))
    END as display_name
  FROM public.profiles p
  WHERE p.first_name IS NOT NULL OR p.last_name IS NOT NULL;
$$;

-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles for family linking" ON public.profiles;

-- Create a more restrictive policy that only allows users to view their own profile
-- The family linking functionality will use the secure function instead
CREATE POLICY "Users can only view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_for_family_linking() TO authenticated;