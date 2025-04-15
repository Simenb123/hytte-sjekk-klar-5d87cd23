
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { Booking } from '@/hooks/useBookings';

interface BookingsListProps {
  bookings: Booking[];
  isGoogleConnected: boolean;
  onNewBooking: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  isConnecting?: boolean;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  isGoogleConnected,
  onNewBooking,
  onConnectGoogle,
  onDisconnectGoogle,
  isConnecting = false
}) => {
  return (
    <div>
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
        onClick={onNewBooking} 
        className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
      >
        Ny booking
      </Button>
      
      {!isGoogleConnected ? (
        <Button 
          onClick={onConnectGoogle} 
          disabled={isConnecting}
          className="w-full mt-3 bg-white text-black border border-gray-300 hover:bg-gray-100"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kobler til...
            </>
          ) : (
            <>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Koble til Google Calendar
            </>
          )}
        </Button>
      ) : (
        <Button 
          onClick={onDisconnectGoogle} 
          variant="outline"
          className="w-full mt-3"
        >
          Koble fra Google Calendar
        </Button>
      )}
    </div>
  );
};
