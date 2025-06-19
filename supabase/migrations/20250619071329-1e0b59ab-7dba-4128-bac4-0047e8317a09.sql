
-- Opprett booking_family_members tabell for å knytte familiemedlemmer til bookinger
CREATE TABLE public.booking_family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, family_member_id)
);

-- Aktiver Row Level Security
ALTER TABLE public.booking_family_members ENABLE ROW LEVEL SECURITY;

-- Opprett RLS-policy for å sikre at brukere kun kan se sine egne booking-familiemedlem-tilknytninger
CREATE POLICY "Users can view their own booking family members"
  ON public.booking_family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_family_members.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Policy for å opprette booking-familiemedlem-tilknytninger
CREATE POLICY "Users can create booking family members for their bookings"
  ON public.booking_family_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_family_members.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Policy for å oppdatere booking-familiemedlem-tilknytninger
CREATE POLICY "Users can update booking family members for their bookings"
  ON public.booking_family_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_family_members.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Policy for å slette booking-familiemedlem-tilknytninger
CREATE POLICY "Users can delete booking family members for their bookings"
  ON public.booking_family_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_family_members.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );
