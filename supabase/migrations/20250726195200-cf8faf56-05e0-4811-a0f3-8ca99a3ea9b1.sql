-- Add gender and birth_date fields to profiles table for better AI personalization
ALTER TABLE public.profiles 
ADD COLUMN gender text,
ADD COLUMN birth_date date;