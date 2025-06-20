import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import NewBookingDialog from '../components/booking/NewBookingDialog';
import EditBookingDialog from '../components/booking/EditBookingDialog';
import { useBookings, Booking } from '@/hooks/useBookings';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { CalendarSection } from '../components/calendar/CalendarSection';
import { GoogleCalendarSection } from '../components/calendar/GoogleCalendarSection';
import { CalendarInfo } from '../components/calendar/CalendarInfo';
import ReminderTestButton from '../components/calendar/ReminderTestButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import BookingListItem from '../components/booking/BookingListItem';
import { addDays, differenceInDays } from 'date-fns';

const CalendarApp: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { bookings, fetchBookings, isLoading: isLoadingBookings, deleteBooking, updateBooking } = useBookings();
  
  const {
    isGoogleConnected,
    isLoadingEvents,
    googleEvents,
    googleTokens,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
    isConnecting,
    connectionError,
    fetchError,
    googleCalendars,
  } = useGoogleCalendar();

  const [sharedCalendarExists, setSharedCalendarExists] = useState(false);

  useEffect(() => {
    if (isGoogleConnected && googleCalendars?.length > 0) {
      const hyttaCalendar = googleCalendars.find(cal => 
        cal.summary === 'Hytte Booking' || cal.summary?.includes('Hytte')
      );
      setSharedCalendarExists(!!hyttaCalendar);
    }
  }, [isGoogleConnected, googleCalendars]);

  useEffect(() => {
    const handleOAuthResponse = async () => {
      const url = new URL(window.location.href);
      const isCallback = url.pathname.includes('/auth/calendar');
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (isCallback) {
        console.log('Detected OAuth callback');
        
        if (error) {
          console.error('OAuth error:', error);
          toast.error(`Google Calendar-autentisering feilet: ${error}`);
          window.location.href = '/calendar';
          return;
        }
        
        if (code) {
          toast.info('Behandler Google Calendar-autentisering...');
          
          try {
            const success = await handleOAuthCallback(code);
            
            if (success) {
              toast.success('Koblet til Google Calendar!');
              setActiveTab("google"); // Bytt til Google-fanen ved vellykket tilkobling
            } else {
              toast.error('Kunne ikke fullføre Google Calendar-autentisering');
            }
            
            window.location.href = '/calendar';
          } catch (err: any) {
            console.error('Error processing OAuth callback:', err);
            toast.error(`Feil ved behandling av Google Calendar-autentisering: ${err.message || 'Ukjent feil'}`);
            window.location.href = '/calendar';
          }
        } else {
          console.error('No code found in OAuth callback');
          toast.error('Ingen autentiseringskode mottatt fra Google');
          window.location.href = '/calendar';
        }
      }
    };
    
    handleOAuthResponse();
  }, [handleOAuthCallback]);

  const bookedDays = bookings.flatMap(booking => {
    const days: Date[] = [];
    const startDate = new Date(booking.from);
    const endDate = new Date(booking.to);
    
    const dayDifference = differenceInDays(endDate, startDate) + 1;
    
    for (let i = 0; i < dayDifference; i++) {
      const currentDate = addDays(new Date(startDate), i);
      days.push(currentDate);
    }
    
    return days;
  });

  const handleShareCalendarSuccess = useCallback(() => {
    setSharedCalendarExists(true);
    toast.success('Felles hytte-kalender er opprettet og delt!');
    fetchGoogleEvents();
  }, [fetchGoogleEvents]);

  const handleBookingSuccess = async (booking) => {
    console.log('Booking success:', booking);
    fetchBookings();
    
    if (isGoogleConnected && googleTokens && booking.addToGoogle) {
      try {
        console.log('Creating Google Calendar event for new booking:', booking);
        
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          method: 'POST',
          body: { 
            action: 'create_event', 
            tokens: googleTokens,
            event: {
              title: booking.title,
              description: booking.description,
              startDate: booking.startDate.toISOString(),
              endDate: booking.endDate.toISOString()
            },
            useSharedCalendar: booking.useSharedCalendar
          }
        });

        if (error || data?.error) {
          throw error || new Error(data?.error);
        }

        if (data?.event) {
          console.log('Successfully created Google Calendar event');
          
          if (booking.useSharedCalendar) {
            toast.success('Booking opprettet i felles hytte-kalender!');
          } else {
            toast.success('Booking opprettet i Google Calendar!');
          }
          
          fetchGoogleEvents();
        }
      } catch (error: any) {
        console.error('Error creating Google Calendar event:', error);
        toast.error(`Kunne ikke opprette hendelse i Google Calendar: ${error.message || 'Ukjent feil'}`);
      }
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setShowEditDialog(true);
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    const success = await updateBooking(id, updates);
    if (success) {
      setShowEditDialog(false);
      setBookingToEdit(null);
      fetchBookings();
    }
    return success;
  };

  const handleNewBooking = useCallback(() => {
    if (!user) {
      toast.error('Du må være logget inn for å lage en booking');
      return;
    }
    setShowNewBookingDialog(true);
  }, [user]);

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Kalender og booking" showBackButton />
      
      <div className="max-w-lg mx-auto p-4 pt-20">
        <CalendarSection 
          date={date} 
          onDateSelect={handleDateSelect} 
          bookedDays={bookedDays} 
        />
        
        <div className="mb-4 flex gap-2">
          <Button onClick={handleNewBooking} className="flex-1 flex items-center justify-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Ny booking
          </Button>
          <ReminderTestButton />
        </div>

        {/* Bookings list section */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h2 className="text-lg font-medium mb-4">Dine bookinger</h2>
          
          {isLoadingBookings ? (
            <p className="text-center py-4 text-gray-500">Laster bookinger...</p>
          ) : bookings.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Ingen bookinger funnet</p>
          ) : (
            <div>
              {bookings.map(booking => (
                <BookingListItem
                  key={booking.id}
                  booking={booking}
                  onEdit={handleEditBooking}
                  onDelete={deleteBooking}
                />
              ))}
            </div>
          )}
        </div>
        
        <GoogleCalendarSection
          isGoogleConnected={isGoogleConnected}
          isLoadingEvents={isLoadingEvents}
          googleEvents={googleEvents}
          fetchGoogleEvents={fetchGoogleEvents}
          googleTokens={googleTokens}
          bookings={bookings}
          onNewBooking={handleNewBooking}
          connectGoogleCalendar={connectGoogleCalendar}
          disconnectGoogleCalendar={disconnectGoogleCalendar}
          isConnecting={isConnecting}
          connectionError={connectionError}
          fetchError={fetchError}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sharedCalendarExists={sharedCalendarExists}
          onShareCalendarSuccess={handleShareCalendarSuccess}
        />
        
        <CalendarInfo isGoogleConnected={isGoogleConnected} />
      </div>

      <NewBookingDialog 
        open={showNewBookingDialog}
        onOpenChange={setShowNewBookingDialog}
        onSuccess={handleBookingSuccess}
        googleIntegration={isGoogleConnected}
        sharedCalendarExists={sharedCalendarExists}
      />

      <EditBookingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        booking={bookingToEdit}
        onUpdate={handleUpdateBooking}
        googleIntegration={isGoogleConnected}
        sharedCalendarExists={sharedCalendarExists}
      />
    </div>
  );
};

export default CalendarApp;
