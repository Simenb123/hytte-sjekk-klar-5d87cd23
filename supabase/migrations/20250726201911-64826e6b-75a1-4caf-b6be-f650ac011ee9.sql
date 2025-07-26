-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  image text,
  is_voice boolean DEFAULT false,
  analysis text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for chat_messages
CREATE POLICY "Users can view messages from their own chat sessions" 
ON public.chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions 
  WHERE chat_sessions.id = chat_messages.session_id 
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their own chat sessions" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_sessions 
  WHERE chat_sessions.id = chat_messages.session_id 
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can update messages in their own chat sessions" 
ON public.chat_messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions 
  WHERE chat_sessions.id = chat_messages.session_id 
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages from their own chat sessions" 
ON public.chat_messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.chat_sessions 
  WHERE chat_sessions.id = chat_messages.session_id 
  AND chat_sessions.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions 
  SET updated_at = now() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update session timestamp when messages are added
CREATE TRIGGER update_chat_session_timestamp
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_session_updated_at();