
import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsList } from '@/components/calendar/BookingsList';
import { GoogleEventsList } from '@/components/calendar/GoogleEventsList';
import NewBookingDialog from '../components/NewBookingDialog';
import { useBookings } from '@/hooks/useBookings';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    connectionError
  } = useGoogleCalendar();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('OAuth error:', error);
      toast.error('Kunne ikke koble til Google Calendar: ' + error);
      // Remove error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      toast.info('Behandler Google Calendar-tilkobling...');
      handleOAuthCallback(code).then(success => {
        if (success) {
          // Remove code from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Fetch events after successful connection
          fetchGoogleEvents();
          setActiveTab('google');
        }
      });
    }
  }, []);

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
    
    // If connected to Google, also create a Google Calendar event
    if (isGoogleConnected && googleTokens) {
      try {
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
          throw error;
        }
        
        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.event) {
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
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="mx-auto"
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            modifiers={{ booked: bookedDays }}
            modifiersClassNames={{
              booked: 'bg-red-100 text-red-600 font-bold',
            }}
          />
        </div>
        
        <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="bookings">Bookinger</TabsTrigger>
            {isGoogleConnected && <TabsTrigger value="google">Google Calendar</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Bookinger</span>
                  {isGoogleConnected && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Google tilkoblet
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingsList
                  bookings={bookings}
                  isGoogleConnected={isGoogleConnected}
                  onNewBooking={() => setShowNewBookingDialog(true)}
                  onConnectGoogle={connectGoogleCalendar}
                  onDisconnectGoogle={disconnectGoogleCalendar}
                  isConnecting={isConnecting}
                  connectionError={connectionError}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {isGoogleConnected && (
            <TabsContent value="google">
              <Card>
                <CardHeader>
                  <CardTitle>Google Calendar Hendelser</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleEventsList
                    events={googleEvents}
                    isLoading={isLoadingEvents}
                    onRefresh={fetchGoogleEvents}
                  />
                </CardContent>
              </Card>
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
