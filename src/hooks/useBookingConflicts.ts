
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface BookingConflict {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  overlaps: 'start' | 'end' | 'complete' | 'contains';
}

interface UseBookingConflictsProps {
  startDate: Date;
  endDate: Date;
  excludeBookingId?: string;
}

export const useBookingConflicts = ({ startDate, endDate, excludeBookingId }: UseBookingConflictsProps) => {
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const checkConflicts = async () => {
    if (!user || !startDate || !endDate) {
      setConflicts([]);
      return;
    }

    setIsLoading(true);

    try {
      // Hent alle bookinger som overlapper med de valgte datoene
      let query = supabase
        .from('bookings')
        .select('id, title, start_date, end_date')
        .neq('user_id', user.id) // Sjekk mot andre brukeres bookinger
        .or(`and(start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()})`);

      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking conflicts:', error);
        setConflicts([]);
        return;
      }

      if (data) {
        const conflictingBookings = data.map(booking => {
          const bookingStart = new Date(booking.start_date);
          const bookingEnd = new Date(booking.end_date);
          
          let overlaps: 'start' | 'end' | 'complete' | 'contains';
          
          if (startDate <= bookingStart && endDate >= bookingEnd) {
            overlaps = 'contains'; // Ny booking inneholder eksisterende booking
          } else if (bookingStart <= startDate && bookingEnd >= endDate) {
            overlaps = 'complete'; // Eksisterende booking inneholder ny booking
          } else if (startDate < bookingEnd && startDate >= bookingStart) {
            overlaps = 'start'; // Ny booking starter før eksisterende slutter
          } else {
            overlaps = 'end'; // Ny booking slutter etter eksisterende starter
          }

          return {
            id: booking.id,
            title: booking.title,
            startDate: bookingStart,
            endDate: bookingEnd,
            overlaps
          };
        });

        setConflicts(conflictingBookings);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflicts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConflicts();
  }, [startDate, endDate, excludeBookingId, user]);

  return {
    conflicts,
    isLoading,
    hasConflicts: conflicts.length > 0,
    checkConflicts
  };
};
