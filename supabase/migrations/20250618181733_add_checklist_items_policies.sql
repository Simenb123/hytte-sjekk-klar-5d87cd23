
-- Enable RLS on checklist_items table if not already enabled
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can create checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can update checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can delete checklist items" ON public.checklist_items;

-- Create policies for checklist_items
CREATE POLICY "Authenticated users can view checklist items"
  ON public.checklist_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create checklist items"
  ON public.checklist_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update checklist items"
  ON public.checklist_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete checklist items"
  ON public.checklist_items
  FOR DELETE
  USING (auth.role() = 'authenticated');
