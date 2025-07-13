-- Restrict inventory_items select to owner and cleanup old policy
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view inventory items" ON public.inventory_items;
CREATE POLICY "Users can view their own inventory items"
  ON public.inventory_items
  FOR SELECT
  USING (auth.uid() = user_id);

