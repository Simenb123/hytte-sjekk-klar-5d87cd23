
import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewBookingDialog from '../components/NewBookingDialog';
import { useBookings } from '@/hooks/useBookings';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { CalendarSection } from '@/components/calendar/CalendarSection';
import { BookingsTab } from '@/components/calendar/BookingsTab';
import { GoogleCalendarTab } from '@/components/calendar/GoogleCalendarTab';

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

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthResponse = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (code) {
        console.log('Found code in URL params, processing OAuth callback...');
        toast.info('Behandler Google Calendar-tilkobling...');
        
        try {
          const success = await handleOAuthCallback(code);
          if (success) {
            console.log('Successfully processed OAuth callback');
            toast.success('Koblet til Google Calendar!');
            window.history.replaceState({}, document.title, window.location.pathname);
            setActiveTab('google');
            fetchGoogleEvents();
          } else {
            console.error('Failed to process OAuth callback');
            toast.error('Kunne ikke koble til Google Calendar');
          }
        } catch (err) {
          console.error('Error handling OAuth callback:', err);
          toast.error('Feil ved behandling av Google Calendar-tilkobling');
        }
      } else if (error) {
        console.error('OAuth error in URL params:', error);
        toast.error('Kunne ikke koble til Google Calendar: ' + error);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (window.location.pathname.includes('/auth/calendar')) {
        console.log('We are on the /auth/calendar path, this is our redirect_uri');
        const authCode = urlParams.get('code');
        const authError = urlParams.get('error');
        
        if (authError) {
          console.error('OAuth error on redirect path:', authError);
          toast.error('Kunne ikke koble til Google Calendar: ' + authError);
        } else if (authCode) {
          console.log('Processing OAuth code from redirect_uri...');
          toast.info('Behandler Google Calendar-tilkobling...');
          
          try {
            const success = await handleOAuthCallback(authCode);
            if (success) {
              console.log('Successfully processed OAuth callback from redirect_uri');
              toast.success('Koblet til Google Calendar!');
            } else {
              console.error('Failed to process OAuth callback from redirect_uri');
              toast.error('Kunne ikke koble til Google Calendar');
            }
          } catch (err) {
            console.error('Error handling OAuth callback from redirect_uri:', err);
            toast.error('Feil ved behandling av Google Calendar-tilkobling');
          }
        }
        window.location.href = '/calendar';
      }
    };
    
    handleOAuthResponse();
  }, [handleOAuthCallback, fetchGoogleEvents]);

  // Days that have bookings
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

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        if (data?.error) {
          console.error('Google Calendar API error:', data.error, data.details);
          throw new Error(data.error);
        }

        if (data?.event) {
          console.log('Successfully created Google Calendar event:', data.event.id);
          toast.success('Booking opprettet i Google Calendar!');
          fetchGoogleEvents();
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
        
        <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="bookings">Bookinger</TabsTrigger>
            {isGoogleConnected && <TabsTrigger value="google">Google Calendar</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="bookings">
            <BookingsTab
              bookings={bookings}
              isGoogleConnected={isGoogleConnected}
              onNewBooking={() => setShowNewBookingDialog(true)}
              onConnectGoogle={connectGoogleCalendar}
              onDisconnectGoogle={disconnectGoogleCalendar}
              isConnecting={isConnecting}
              connectionError={connectionError}
            />
          </TabsContent>
          
          {isGoogleConnected && (
            <TabsContent value="google">
              <GoogleCalendarTab
                isLoadingEvents={isLoadingEvents}
                googleEvents={googleEvents}
                fetchGoogleEvents={fetchGoogleEvents}
                fetchError={fetchError}
              />
            </TabsContent>
          )}
        </Tabs>
        
        <div className="text-center text-sm text-gray-500">
          <p>Datoer markert med rødt er allerede booket</p>
          {isGoogleConnected && <p>Google Calendar er tilkoblet og klar til bruk!</p>}
        </div>
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
