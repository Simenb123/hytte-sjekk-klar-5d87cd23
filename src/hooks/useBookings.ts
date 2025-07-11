
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { endOfDay } from 'date-fns';

import type { Database } from '@/integrations/supabase/types';

export interface Booking {
  id: string;
  title: string;
  description?: string;
  from: Date;
  to: Date;
  user: string;
  googleEventId?: string;
  familyMembers?: Array<{
    id: string;
    name: string;
    nickname?: string;
  }>;
}

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type FamilyMemberRow = Database['public']['Tables']['family_members']['Row'];
type BookingFamilyMemberRow = Database['public']['Tables']['booking_family_members']['Row'];

interface BookingQueryRow extends BookingRow {
  booking_family_members: Array<
    BookingFamilyMemberRow & {
      family_members: Pick<FamilyMemberRow, 'id' | 'name' | 'nickname'>;
    }
  >;
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
        .select(`
          *,
          booking_family_members (
            family_member_id,
            family_members (
              id,
              name,
              nickname
            )
          )
        `)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      console.log('Fetched bookings:', data);
      
      if (data) {
        const formattedBookings = (data as BookingQueryRow[]).map((booking) => ({
          id: booking.id,
          title: booking.title || 'Ingen tittel',
          description: booking.description,
          from: new Date(booking.start_date),
          to: new Date(booking.end_date),
          user: booking.user_id || 'Ukjent',
          googleEventId: booking.google_event_id,
          familyMembers:
            booking.booking_family_members?.map((bfm) => ({
              id: bfm.family_members.id,
              name: bfm.family_members.name,
              nickname: bfm.family_members.nickname ?? undefined,
            })) || []
        }));
        
        setBookings(formattedBookings);
      } else {
        setBookings([]);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Kunne ikke hente bookinger');
      toast.error(`Kunne ikke hente bookinger: ${err.message}`);
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error deleting booking:', err);
      toast.error(`Kunne ikke slette booking: ${err.message}`);
      return false;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Omit<Booking, 'id' | 'user' | 'googleEventId' | 'familyMembers'>>) => {
    try {
      // Map from our Booking interface to the database structure
      const dbUpdates: Database['public']['Tables']['bookings']['Update'] = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.from !== undefined) dbUpdates.start_date = updates.from.toISOString();
      if (updates.to !== undefined) {
        dbUpdates.end_date = updates.to.toISOString();
      }
      
      const { error } = await supabase
        .from('bookings')
        .update(dbUpdates)
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Booking oppdatert');
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === id 
          ? { ...booking, ...updates } 
          : booking
      ));
      
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error updating booking:', err);
      toast.error(`Kunne ikke oppdatere booking: ${err.message}`);
      return false;
    }
  };

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    deleteBooking,
    updateBooking
  };
}
