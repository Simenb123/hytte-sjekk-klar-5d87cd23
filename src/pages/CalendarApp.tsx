
import React, { useState } from 'react';
import AppHeader from '../components/AppHeader';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CalendarApp: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState([
    {
      id: '1',
      from: new Date(2025, 3, 20), // April 20, 2025
      to: new Date(2025, 3, 24),   // April 24, 2025
      user: 'Familien Berg'
    },
    {
      id: '2',
      from: new Date(2025, 4, 15), // May 15, 2025
      to: new Date(2025, 4, 20),   // May 20, 2025
      user: 'Vennegruppen'
    }
  ]);

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
    toast.success('Booking-funksjon kommer snart!', {
      description: 'Du vil kunne legge til nye bookinger her.',
    });
  };

  const connectGoogleCalendar = () => {
    toast.info('Google Calendar-integrasjon', {
      description: 'Kobling til Google Calendar kommer snart!',
    });
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
              // Disable dates in the past
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
            {bookings.map(booking => (
              <div key={booking.id} className="mb-4 p-3 border rounded-lg">
                <div className="font-medium">{booking.user}</div>
                <div className="text-sm text-gray-500">
                  {booking.from.toLocaleDateString('no')} - {booking.to.toLocaleDateString('no')}
                </div>
              </div>
            ))}
            
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
    </div>
  );
};

export default CalendarApp;
