
-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  birth_date DATE,
  role TEXT, -- 'parent', 'child', 'other'
  is_user BOOLEAN DEFAULT false, -- true if this family member has their own user account
  linked_user_id UUID REFERENCES auth.users, -- if is_user is true, this points to their user account
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for family_members
CREATE POLICY "Users can view their own family members" 
  ON public.family_members 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family members" 
  ON public.family_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" 
  ON public.family_members 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" 
  ON public.family_members 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add family_member_id column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN family_member_id UUID REFERENCES public.family_members(id);

-- Add family_member_id column to checklist_items for task assignment
ALTER TABLE public.checklist_items 
ADD COLUMN assigned_to UUID REFERENCES public.family_members(id);

-- Create a table for task assignments and completion tracking per family member
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_item_id UUID REFERENCES public.checklist_items(id) NOT NULL,
  family_member_id UUID REFERENCES public.family_members(id) NOT NULL,
  assigned_by_user_id UUID REFERENCES auth.users NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(checklist_item_id, family_member_id)
);

-- Add RLS for task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task assignments for their family" 
  ON public.task_assignments 
  FOR SELECT 
  USING (
    assigned_by_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE id = family_member_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task assignments for their family" 
  ON public.task_assignments 
  FOR INSERT 
  WITH CHECK (
    assigned_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE id = family_member_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update task assignments for their family" 
  ON public.task_assignments 
  FOR UPDATE 
  USING (
    assigned_by_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE id = family_member_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task assignments for their family" 
  ON public.task_assignments 
  FOR DELETE 
  USING (
    assigned_by_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE id = family_member_id AND user_id = auth.uid()
    )
  );
