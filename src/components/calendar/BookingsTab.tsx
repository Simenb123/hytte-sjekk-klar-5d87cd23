
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsList } from './BookingsList';
import { Badge } from '@/components/ui/badge';
import { isEdgeFunctionError } from './google/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  const hasConnectionIssue = isEdgeFunctionError(connectionError);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Bookinger</span>
          {isGoogleConnected && !hasConnectionIssue && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Google tilkoblet
            </Badge>
          )}
          {isGoogleConnected && hasConnectionIssue && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Google midlertidig utilgjengelig
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasConnectionIssue && isGoogleConnected && (
          <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-700 mb-2">
              Det er problemer med tilkobling til Google Calendar-tjenesten. Dette er et midlertidig teknisk problem.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs" 
              onClick={onConnectGoogle}
              disabled={isConnecting}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {isConnecting ? 'Prøver å koble til...' : 'Prøv tilkobling på nytt'}
            </Button>
          </div>
        )}
        
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
