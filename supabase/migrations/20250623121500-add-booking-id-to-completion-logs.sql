-- Add booking_id column to completion_logs
ALTER TABLE public.completion_logs ADD COLUMN booking_id UUID REFERENCES public.bookings(id);
