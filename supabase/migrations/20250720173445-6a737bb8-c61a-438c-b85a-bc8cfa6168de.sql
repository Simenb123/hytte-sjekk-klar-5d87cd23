-- Add app-related columns to checklist_items table
ALTER TABLE public.checklist_items 
ADD COLUMN app_name TEXT,
ADD COLUMN app_url_ios TEXT,
ADD COLUMN app_url_android TEXT,
ADD COLUMN app_icon_url TEXT,
ADD COLUMN app_description TEXT;