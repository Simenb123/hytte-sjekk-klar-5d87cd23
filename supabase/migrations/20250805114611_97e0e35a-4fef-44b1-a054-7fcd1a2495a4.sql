-- Create table for booking checklist completions
CREATE TABLE public.booking_checklist_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.booking_checklist_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for booking checklist completions
CREATE POLICY "Users can view their own booking checklist completions" 
ON public.booking_checklist_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking checklist completions" 
ON public.booking_checklist_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking checklist completions" 
ON public.booking_checklist_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking checklist completions" 
ON public.booking_checklist_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_booking_checklist_completions_updated_at
BEFORE UPDATE ON public.booking_checklist_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_booking_checklist_completions_booking_id ON public.booking_checklist_completions(booking_id);
CREATE INDEX idx_booking_checklist_completions_user_id ON public.booking_checklist_completions(user_id);
CREATE INDEX idx_booking_checklist_completions_category ON public.booking_checklist_completions(category);

-- Create unique constraint to prevent duplicate completions for same booking/category
ALTER TABLE public.booking_checklist_completions 
ADD CONSTRAINT unique_booking_category_completion 
UNIQUE (booking_id, category);