
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Booking {
  id: string;
  title: string;
  description?: string;
  from: Date;
  to: Date;
  user: string;
  googleEventId?: string;
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setBookings(data.map(booking => ({
        ...booking,
        from: new Date(booking.start_date),
        to: new Date(booking.end_date),
        user: booking.title
      })));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Kunne ikke hente bookinger');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    fetchBookings
  };
}
