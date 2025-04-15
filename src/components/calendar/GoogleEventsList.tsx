
import React from 'react';
import { EventListItem } from './google/EventListItem';
import { ErrorAlert } from './google/ErrorAlert';
import { RefreshButton } from './google/RefreshButton';
import { isEdgeFunctionError } from './google/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { GoogleEvent } from '@/types/googleCalendar.types';

interface GoogleEventsListProps {
  events: GoogleEvent[];
  isLoading: boolean;
  onRefresh: () => void;
  error?: string | null;
}

export const GoogleEventsList: React.FC<GoogleEventsListProps> = ({
  events,
  isLoading,
  onRefresh,
  error
}) => {
  const handleRefresh = () => {
    toast.info('Oppdaterer Google Calendar...');
    onRefresh();
  };

  const isEdgeFunctionIssue = isEdgeFunctionError(error);
  
  if (error && error.includes('Google Calendar-tilgangen har utløpt')) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-sm">
            Din tilkobling til Google Calendar har utløpt eller er ugyldig. 
            Du må koble til på nytt.
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-8">
          <p className="text-gray-500 mb-4">
            For å koble til Google Calendar igjen, klikk på knappen nedenfor.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={handleRefresh} isEdgeFunctionIssue={isEdgeFunctionIssue} />;
  }

  if (events.length === 0) {
    return (
      <>
        <div className="text-center text-gray-500 my-8 py-6 border border-dashed rounded-lg">
          <div className="mb-2">Ingen hendelser funnet i Google Calendar</div>
          <div className="text-sm">Google Calendar er tilkoblet, men ingen hendelser ble funnet</div>
        </div>
        <RefreshButton isLoading={isLoading} onRefresh={handleRefresh} />
      </>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-700">
            Dette er hendelser fra din Google Calendar. Alle nye bookinger vil bli synkronisert hit.
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="space-y-4">
        {events.map(event => (
          <EventListItem key={event.id} event={event} />
        ))}
      </div>
      
      <RefreshButton isLoading={isLoading} onRefresh={handleRefresh} />
    </>
  );
};
