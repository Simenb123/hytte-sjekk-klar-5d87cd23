
import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import NewBookingDialog from '../components/NewBookingDialog';
import { useBookings } from '@/hooks/useBookings';
import { useGoogleCalendar } from '@/hooks/google-calendar';
import { toast } from 'sonner';
import { CalendarSection } from '@/components/calendar/CalendarSection';
import { GoogleCalendarSection } from '@/components/calendar/GoogleCalendarSection';
import { CalendarInfo } from '@/components/calendar/CalendarInfo';
import { supabase } from '@/integrations/supabase/client';

const CalendarApp: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");

  const { bookings, fetchBookings } = useBookings();
  const {
    isGoogleConnected,
    googleTokens,
    isLoadingEvents,
    googleEvents,
    fetchGoogleEvents,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleOAuthCallback,
    isConnecting,
    connectionError,
    fetchError
  } = useGoogleCalendar();

  useEffect(() => {
    const handleOAuthResponse = async () => {
      const isCallbackPath = window.location.pathname.includes('/auth/calendar');
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (isCallbackPath) {
        if (error) {
          console.error('OAuth error returned in callback:', error);
          toast.error(`Google Calendar-autentisering feilet: ${error}`);
          window.location.href = '/calendar';
          return;
        }
        
        if (code) {
          toast.info('Behandler Google Calendar-autentisering...');
          
          try {
            const success = await handleOAuthCallback(code);
            if (success) {
              console.log('Successfully authenticated with Google Calendar');
              toast.success('Koblet til Google Calendar!');
              window.location.href = '/calendar';
            } else {
              console.error('Failed to complete Google Calendar authentication');
              toast.error('Kunne ikke fullføre Google Calendar-autentisering');
              window.location.href = '/calendar';
            }
          } catch (err) {
            console.error('Error in OAuth callback processing:', err);
            toast.error('Feil ved behandling av Google Calendar-autentisering');
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
    let currentDate = new Date(booking.from);
    
    while (currentDate <= booking.to) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  });

  const handleBookingSuccess = async (booking) => {
    fetchBookings();
    
    if (isGoogleConnected && googleTokens) {
      try {
        console.log('Creating Google Calendar event for new booking:', booking.title);
        
        const { data, error } = await supabase.functions.invoke('google-calendar', {
          method: 'POST',
          body: { 
            action: 'create_event', 
            tokens: googleTokens,
            event: {
              title: booking.title,
              description: booking.description,
              startDate: booking.startDate,
              endDate: booking.endDate
            }
          }
        });

        if (error || data?.error) {
          throw error || new Error(data?.error);
        }

        if (data?.event) {
          console.log('Successfully created Google Calendar event:', data.event.id);
          toast.success('Booking opprettet i Google Calendar!');
          if (googleTokens) {
            fetchGoogleEvents(googleTokens);
          }
        }
      } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        toast.error('Kunne ikke opprette hendelse i Google Calendar');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Kalender og booking" showBackButton showHomeButton />
      
      <div className="max-w-lg mx-auto p-4">
        <CalendarSection 
          date={date} 
          onDateSelect={setDate} 
          bookedDays={bookedDays} 
        />
        
        <GoogleCalendarSection
          isGoogleConnected={isGoogleConnected}
          isLoadingEvents={isLoadingEvents}
          googleEvents={googleEvents}
          fetchGoogleEvents={fetchGoogleEvents}
          googleTokens={googleTokens}
          bookings={bookings}
          onNewBooking={() => setShowNewBookingDialog(true)}
          connectGoogleCalendar={connectGoogleCalendar}
          disconnectGoogleCalendar={disconnectGoogleCalendar}
          isConnecting={isConnecting}
          connectionError={connectionError}
          fetchError={fetchError}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <CalendarInfo isGoogleConnected={isGoogleConnected} />
      </div>

      <NewBookingDialog 
        open={showNewBookingDialog}
        onOpenChange={setShowNewBookingDialog}
        onSuccess={handleBookingSuccess}
        googleIntegration={isGoogleConnected}
      />
    </div>
  );
};

export default CalendarApp;
