import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import NewBookingDialog from '../components/NewBookingDialog';

const CalendarApp: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState([]);
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);

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
            toast.success('Koblet til Google Calendar!');
            // Remove code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Return to previous page if available
            const returnUrl = sessionStorage.getItem('calendarReturnUrl');
            if (returnUrl) {
              sessionStorage.removeItem('calendarReturnUrl');
              window.location.href = returnUrl;
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
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bookinger</CardTitle>
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
            
            <Button 
              onClick={connectGoogleCalendar} 
              className="w-full mt-3 bg-green-600 hover:bg-green-700"
              variant="outline"
            >
              Koble til Google Calendar
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500">
          <p>Datoer markert med rødt er allerede booket</p>
          <p>Google Calendar-integrasjon kommer snart!</p>
        </div>
      </div>

      <NewBookingDialog 
        open={showNewBookingDialog}
        onOpenChange={setShowNewBookingDialog}
        onSuccess={fetchBookings}
      />
    </div>
  );
};

export default CalendarApp;
