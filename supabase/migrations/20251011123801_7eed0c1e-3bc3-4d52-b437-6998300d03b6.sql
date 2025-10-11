-- Create quick_contacts table for storing user contacts
CREATE TABLE public.quick_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('audio', 'video', 'sms')),
  show_on_main BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quick contacts"
  ON public.quick_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quick contacts"
  ON public.quick_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick contacts"
  ON public.quick_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick contacts"
  ON public.quick_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_quick_contacts_updated_at
  BEFORE UPDATE ON public.quick_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contacts (Simen, Eivind, Knut) for all existing users
INSERT INTO public.quick_contacts (user_id, name, phone_number, contact_type, show_on_main, sort_order)
SELECT 
  id as user_id,
  'Simen' as name,
  '+4797979797' as phone_number,
  'video' as contact_type,
  true as show_on_main,
  1 as sort_order
FROM auth.users
UNION ALL
SELECT 
  id as user_id,
  'Eivind' as name,
  '+4797979798' as phone_number,
  'audio' as contact_type,
  true as show_on_main,
  2 as sort_order
FROM auth.users
UNION ALL
SELECT 
  id as user_id,
  'Knut' as name,
  '+4797979799' as phone_number,
  'sms' as contact_type,
  true as show_on_main,
  3 as sort_order
FROM auth.users;