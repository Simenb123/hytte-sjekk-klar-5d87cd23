
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, AlertCircle, Share2 } from 'lucide-react';
import type { Booking } from '@/hooks/useBookings';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingsListProps {
  bookings: Booking[];
  isGoogleConnected: boolean;
  onNewBooking: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  isConnecting?: boolean;
  connectionError?: string | null;
  sharedCalendarExists?: boolean;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  isGoogleConnected,
  onNewBooking,
  onConnectGoogle,
  onDisconnectGoogle,
  isConnecting = false,
  connectionError = null,
  sharedCalendarExists = false
}) => {
  return (
    <div>
      {connectionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {connectionError}
          </AlertDescription>
        </Alert>
      )}
      
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
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
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
      
      {isGoogleConnected && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Google Calendar er tilkoblet. Alle bookinger vil automatisk synkroniseres.
          {sharedCalendarExists && (
            <div className="mt-1 text-green-600">
              Felles hytte-kalender er aktivert og delt med familien.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
