
import React, { useEffect } from 'react';
import { GoogleCalendarTab } from './GoogleCalendarTab';
import { BookingsTab } from './BookingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { isEdgeFunctionError, isAuthError, formatErrorMessage } from './google/utils';
import { Button } from '@/components/ui/button';
import { useConnectionRetry } from '@/hooks/google-calendar/useConnectionRetry';

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
  // Improved error detection and handling
  const hasConnectionIssue = isEdgeFunctionError(connectionError) || isEdgeFunctionError(fetchError);
  const hasAuthIssue = isAuthError(connectionError) || isAuthError(fetchError);
  
  const { isRetrying, handleRetry } = useConnectionRetry(
    async () => {
      try {
        // If it's a connection issue, just try to connect again.
        // If it's an auth issue, we need to reconnect.
        if (hasAuthIssue) {
          connectGoogleCalendar();
        } else if (isGoogleConnected) {
          await fetchGoogleEvents();
        } else {
          connectGoogleCalendar();
        }
        return !hasConnectionIssue && !hasAuthIssue;
      } catch (error) {
        console.error('Retry failed:', error);
        return false;
      }
    },
    3,  // max retries
    5   // initial backoff in seconds
  );
  
  // Get appropriate alert variant based on error type
  const getAlertVariant = (): "default" | "destructive" => {
    if (hasConnectionIssue) return "destructive";
    if (hasAuthIssue) return "destructive";
    return "destructive";
  };
  
  // If there's a connection issue and user is on Google tab, switch to bookings
  useEffect(() => {
    if ((hasConnectionIssue || hasAuthIssue) && activeTab === 'google') {
      setActiveTab('bookings');
    }
  }, [hasConnectionIssue, hasAuthIssue, activeTab, setActiveTab]);

  // Format error message for better user experience
  const getErrorMessage = () => {
    if (hasConnectionIssue) {
      return "Det er problemer med tilkobling til serveren. Du kan fortsatt bruke booking-funksjonen, men Google Calendar-integrasjonen er midlertidig utilgjengelig.";
    }
    if (hasAuthIssue) {
      return "Din tilkobling til Google Calendar har utløpt. Koble til på nytt for å fortsette å bruke integrasjonen.";
    }
    if (connectionError) {
      return formatErrorMessage(connectionError);
    }
    if (fetchError) {
      return formatErrorMessage(fetchError);
    }
    return null;
  };

  const errorMessage = getErrorMessage();

  return (
    <>
      {errorMessage && (
        <Alert variant={getAlertVariant()} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>
              {errorMessage}
              {hasConnectionIssue && " Prøv igjen senere eller kontakt support hvis problemet vedvarer."}
              {hasAuthIssue && " Dette skjer vanligvis når tilgangen har utløpt."}
            </span>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-4 whitespace-nowrap"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Prøver...' : 'Prøv igjen'}
            </Button>
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
          {!isGoogleConnected && (
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
            isConnecting={isConnecting || isRetrying}
            connectionError={connectionError}
          />
        </TabsContent>
        
        {isGoogleConnected && (
          <TabsContent value="google">
            <GoogleCalendarTab
              isLoadingEvents={isLoadingEvents}
              googleEvents={googleEvents}
              fetchGoogleEvents={fetchGoogleEvents}
              connectGoogleCalendar={connectGoogleCalendar}
              fetchError={fetchError}
            />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
};
