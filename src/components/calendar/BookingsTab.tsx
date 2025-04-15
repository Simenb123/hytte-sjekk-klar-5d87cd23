
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsList } from './BookingsList';
import { Badge } from '@/components/ui/badge';

interface BookingsTabProps {
  bookings: any[];
  isGoogleConnected: boolean;
  onNewBooking: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  isConnecting: boolean;
  connectionError: string | null;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  isGoogleConnected,
  onNewBooking,
  onConnectGoogle,
  onDisconnectGoogle,
  isConnecting,
  connectionError
}) => {
  return (
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
          onNewBooking={onNewBooking}
          onConnectGoogle={onConnectGoogle}
          onDisconnectGoogle={onDisconnectGoogle}
          isConnecting={isConnecting}
          connectionError={connectionError}
        />
      </CardContent>
    </Card>
  );
};
