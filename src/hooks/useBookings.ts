
import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching bookings...');
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      console.log('Fetched bookings:', data);
      
      if (data) {
        const formattedBookings = data.map(booking => ({
          id: booking.id,
          title: booking.title || 'Ingen tittel',
          description: booking.description,
          from: new Date(booking.start_date),
          to: new Date(booking.end_date),
          user: booking.user_id || 'Ukjent',
          // Check if google_event_id exists, it might not be in some database rows
          googleEventId: booking.google_event_id || undefined
        }));
        
        setBookings(formattedBookings);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Kunne ikke hente bookinger');
      toast.error(`Kunne ikke hente bookinger: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Booking slettet');
      setBookings(prev => prev.filter(booking => booking.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast.error(`Kunne ikke slette booking: ${error.message}`);
      return false;
    }
  };

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    deleteBooking
  };
}
