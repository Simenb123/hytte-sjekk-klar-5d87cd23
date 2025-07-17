import { useMemo } from 'react';
import { useBookings, type Booking } from './useBookings';

export function useActiveBooking() {
  const { bookings, isLoading, error } = useBookings();

  const activeBooking = useMemo((): Booking | null => {
    if (!bookings || bookings.length === 0) return null;

    const now = new Date();
    
    // First check for current ongoing bookings
    const currentBooking = bookings.find(booking => 
      booking.from <= now && booking.to >= now
    );
    
    if (currentBooking) return currentBooking;
    
    // Then find the nearest upcoming booking (within next 7 days)
    const upcomingBookings = bookings.filter(booking => 
      booking.from > now && 
      booking.from <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    );
    
    if (upcomingBookings.length > 0) {
      return upcomingBookings.sort((a, b) => a.from.getTime() - b.from.getTime())[0];
    }
    
    // Finally, check for recent bookings (within last 2 days)
    const recentBookings = bookings.filter(booking =>
      booking.to < now &&
      booking.to >= new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    );
    
    if (recentBookings.length > 0) {
      return recentBookings.sort((a, b) => b.to.getTime() - a.to.getTime())[0];
    }
    
    return null;
  }, [bookings]);

  const hasMultipleRelevantBookings = useMemo(() => {
    if (!bookings || bookings.length <= 1) return false;
    
    const now = new Date();
    const relevantBookings = bookings.filter(booking => {
      const daysDiff = Math.abs(now.getTime() - booking.from.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Bookings within 7 days
    });
    
    return relevantBookings.length > 1;
  }, [bookings]);

  return {
    activeBooking,
    hasMultipleRelevantBookings,
    allBookings: bookings,
    isLoading,
    error
  };
}