
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsList } from './BookingsList';
import { Badge } from '@/components/ui/badge';
import { isEdgeFunctionError } from './google/utils';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/hooks/useBookings';
import type { GoogleOAuthTokens } from '@/types/googleCalendar.types';
import { RefreshCw, Calendar, Share2, Smartphone } from 'lucide-react';
import { ShareCalendarDialog } from './ShareCalendarDialog';
import { CalendarExportDialog } from './CalendarExportDialog';

interface BookingsTabProps {
  bookings: Booking[];
  isGoogleConnected: boolean;
  onNewBooking: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  isConnecting: boolean;
  connectionError: string | null;
  googleTokens?: GoogleOAuthTokens;
  sharedCalendarExists?: boolean;
  onShareCalendarSuccess?: () => void;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  isGoogleConnected,
  onNewBooking,
  onConnectGoogle,
  onDisconnectGoogle,
  isConnecting,
  connectionError,
  googleTokens,
  sharedCalendarExists = false,
  onShareCalendarSuccess
}) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const hasConnectionIssue = isEdgeFunctionError(connectionError);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Bookinger</span>
          <div className="flex space-x-2">
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
            {isGoogleConnected && !hasConnectionIssue && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs flex items-center" 
                  onClick={() => setShowExportDialog(true)}
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobil-app
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs flex items-center" 
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  {sharedCalendarExists ? 'Del kalender' : 'Opprett felleskalender'}
                </Button>
              </>
            )}
          </div>
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
          sharedCalendarExists={sharedCalendarExists}
        />
      </CardContent>
      
      {isGoogleConnected && googleTokens && (
        <>
          <ShareCalendarDialog 
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            googleTokens={googleTokens}
            onSuccess={onShareCalendarSuccess}
          />
          
          <CalendarExportDialog
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
            googleTokens={googleTokens}
          />
        </>
      )}
    </Card>
  );
};
