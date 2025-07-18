-- Add missing push_enabled column to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN push_enabled boolean DEFAULT true;