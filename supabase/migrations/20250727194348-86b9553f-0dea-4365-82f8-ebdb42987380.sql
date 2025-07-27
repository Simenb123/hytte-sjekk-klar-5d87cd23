-- Add action_data field to chat_messages table for storing action data
ALTER TABLE public.chat_messages 
ADD COLUMN action_data JSONB;