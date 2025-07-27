-- Add suggested_actions field to chat_messages table for persistent action storage
ALTER TABLE public.chat_messages 
ADD COLUMN suggested_actions JSONB;