
-- Opprett notifications tabell for å lagre notifikasjoner til brukerne
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  read BOOLEAN NOT NULL DEFAULT false,
  related_booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aktiver Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for å la brukere se sine egne notifikasjoner
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for å la brukere oppdatere sine egne notifikasjoner (markere som lest)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for å la systemet opprette notifikasjoner (via Edge Functions eller triggers)
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Opprett indeks for bedre ytelse
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
