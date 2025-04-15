
import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import NewBookingDialog from '../components/NewBookingDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface Booking {
  id: string;
  title: string;
  description?: string;
  from: Date;
  to: Date;
  user: string;
  googleEventId?: string;
}

const CalendarApp: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");

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

  const fetchGoogleEvents = async () => {
    if (!googleTokens) return;
    
    setIsLoadingEvents(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'POST',
        body: { 
          action: 'list_events',
          tokens: googleTokens
        }
      });

      if (error) throw error;
      
      if (data?.events) {
        setGoogleEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      toast.error('Kunne ikke hente Google Calendar-hendelser');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Check for stored Google tokens
  useEffect(() => {
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        setGoogleTokens(tokens);
        setIsGoogleConnected(true);
      } catch (e) {
        localStorage.removeItem('googleCalendarTokens');
      }
    }
  }, []);

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch Google events when tokens are available
  useEffect(() => {
    if (googleTokens && isGoogleConnected) {
      fetchGoogleEvents();
    }
  }, [googleTokens, isGoogleConnected]);

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

  const handleNewBooking = () => {
    setShowNewBookingDialog(true);
  };

  const createGoogleEvent = async (booking) => {
    if (!googleTokens) {
      toast.error('Du må koble til Google Calendar først');
      return;
    }

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

      if (error) throw error;
      
      if (data?.event) {
        toast.success('Booking opprettet i Google Calendar!');
        fetchGoogleEvents();
        return data.event.id;
      }
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      toast.error('Kunne ikke opprette hendelse i Google Calendar');
    }
    return null;
  };

  const connectGoogleCalendar = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        method: 'GET',
      });

      if (error) throw error;
      
      if (data?.url) {
        // Store the current URL in sessionStorage to return after OAuth
        sessionStorage.setItem('calendarReturnUrl', window.location.href);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Kunne ikke koble til Google Calendar');
    }
  };

  const disconnectGoogleCalendar = () => {
    localStorage.removeItem('googleCalendarTokens');
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    setGoogleEvents([]);
    toast.success('Koblet fra Google Calendar');
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          const { data, error } = await supabase.functions.invoke('google-calendar', {
            method: 'POST',
            body: { code }
          });

          if (error) throw error;

          if (data?.tokens) {
            localStorage.setItem('googleCalendarTokens', JSON.stringify(data.tokens));
            setGoogleTokens(data.tokens);
            setIsGoogleConnected(true);
            toast.success('Koblet til Google Calendar!');
            
            // Remove code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Return to previous page if available
            const returnUrl = sessionStorage.getItem('calendarReturnUrl');
            if (returnUrl) {
              sessionStorage.removeItem('calendarReturnUrl');
              // Don't redirect, just stay on the current page to avoid a refresh
            }
          }
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
          toast.error('Kunne ikke fullføre Google Calendar-integrasjonen');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const handleBookingSuccess = async (booking) => {
    fetchBookings();
    
    // If connected to Google, also create a Google Calendar event
    if (isGoogleConnected && googleTokens) {
      const eventId = await createGoogleEvent(booking);
      if (eventId) {
        // Optionally update the booking in the database with the Google Event ID
        // This would require an additional column in the bookings table
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
            disabled={(date) => {
              return date < new Date(new Date().setHours(0, 0, 0, 0));
            }}
            modifiers={{
              booked: bookedDays,
            }}
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
                {bookings.length > 0 ? (
                  bookings.map(booking => (
                    <div key={booking.id} className="mb-4 p-3 border rounded-lg">
                      <div className="font-medium">{booking.user}</div>
                      <div className="text-sm text-gray-500">
                        {booking.from.toLocaleDateString('no')} - {booking.to.toLocaleDateString('no')}
                      </div>
                      {booking.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {booking.description}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 my-4">
                    Ingen bookinger enda
                  </div>
                )}
                
                <Button 
                  onClick={handleNewBooking} 
                  className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                >
                  Ny booking
                </Button>
                
                {!isGoogleConnected ? (
                  <Button 
                    onClick={connectGoogleCalendar} 
                    className="w-full mt-3 bg-white text-black border border-gray-300 hover:bg-gray-100"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Koble til Google Calendar
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnectGoogleCalendar} 
                    variant="outline"
                    className="w-full mt-3"
                  >
                    Koble fra Google Calendar
                  </Button>
                )}
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
                  {isLoadingEvents ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                  ) : googleEvents.length > 0 ? (
                    googleEvents.map(event => (
                      <div key={event.id} className="mb-4 p-3 border rounded-lg">
                        <div className="font-medium">{event.summary}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.start.dateTime).toLocaleString('no')} - {new Date(event.end.dateTime).toLocaleString('no')}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 my-4">
                      Ingen hendelser funnet i Google Calendar
                    </div>
                  )}
                  
                  <Button 
                    onClick={fetchGoogleEvents} 
                    className="w-full mt-3"
                  >
                    Oppdater Google Calendar
                  </Button>
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
