
import React from 'react';
import { GoogleCalendarTab } from './GoogleCalendarTab';
import { BookingsTab } from './BookingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { isEdgeFunctionError } from './google/utils';

interface GoogleCalendarSectionProps {
  isGoogleConnected: boolean;
  isLoadingEvents: boolean;
  googleEvents: any[];
  fetchGoogleEvents: () => void;
  googleTokens: any;
  bookings: any[];
  onNewBooking: () => void;
  connectGoogleCalendar: () => void;
  disconnectGoogleCalendar: () => void;
  isConnecting: boolean;
  connectionError: string | null;
  fetchError: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const GoogleCalendarSection: React.FC<GoogleCalendarSectionProps> = ({
  isGoogleConnected,
  isLoadingEvents,
  googleEvents,
  fetchGoogleEvents,
  googleTokens,
  bookings,
  onNewBooking,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  isConnecting,
  connectionError,
  fetchError,
  activeTab,
  setActiveTab
}) => {
  // Improved connection issue detection
  const hasConnectionIssue = isEdgeFunctionError(connectionError) || isEdgeFunctionError(fetchError);
  
  // If there's a connection issue and user is on Google tab, switch to bookings
  React.useEffect(() => {
    if (hasConnectionIssue && activeTab === 'google') {
      setActiveTab('bookings');
    }
  }, [hasConnectionIssue, activeTab, setActiveTab]);

  return (
    <>
      {hasConnectionIssue && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Det er problemer med tilkobling til serveren. Du kan fortsatt bruke booking-funksjonen, 
            men Google Calendar-integrasjonen er midlertidig utilgjengelig. 
            Prøv igjen senere eller kontakt support hvis problemet vedvarer.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="bookings">Bookinger</TabsTrigger>
          {isGoogleConnected && !hasConnectionIssue && <TabsTrigger value="google">Google Calendar</TabsTrigger>}
          {isGoogleConnected && hasConnectionIssue && (
            <TabsTrigger value="google" disabled className="opacity-50 cursor-not-allowed">
              Google Calendar
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="bookings">
          <BookingsTab
            bookings={bookings}
            isGoogleConnected={isGoogleConnected}
            onNewBooking={onNewBooking}
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
    </>
  );
};
