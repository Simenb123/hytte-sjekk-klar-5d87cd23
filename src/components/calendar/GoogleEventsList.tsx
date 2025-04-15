
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  htmlLink?: string;
}

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('no');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
            <Button 
              variant="link" 
              className="p-0 ml-2 text-xs underline" 
              onClick={handleRefresh}
            >
              Prøv igjen
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : events.length > 0 ? (
        <>
          <div className="mb-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-700">
                Dette er hendelser fra din Google Calendar. Alle nye bookinger vil bli synkronisert hit.
              </AlertDescription>
            </Alert>
          </div>
          
          {events.map(event => (
            <div key={event.id} className="mb-4 p-3 border rounded-lg hover:shadow-md transition-shadow">
              <div className="font-medium flex justify-between">
                <span>{event.summary}</span>
                {event.htmlLink && (
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-700 flex items-center">
                    <span className="text-xs mr-1 hidden sm:inline">Åpne</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(event.start.dateTime)} - {formatDate(event.end.dateTime)}
              </div>
              {event.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {event.description}
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <div className="text-center text-gray-500 my-8 py-6">
          <div className="mb-2">Ingen hendelser funnet i Google Calendar</div>
          <div className="text-sm">Sync med Google Calendar for å se hendelser her</div>
        </div>
      )}
      
      <Button 
        onClick={handleRefresh} 
        disabled={isLoading}
        className="w-full mt-3"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Oppdaterer...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater Google Calendar
          </>
        )}
      </Button>
      
      <div className="flex justify-center mt-4">
        <a 
          href="https://calendar.google.com/calendar/u/0/r" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 flex items-center hover:underline"
        >
          <Share2 className="h-3 w-3 mr-1" /> Åpne i Google Calendar
        </a>
      </div>
    </div>
  );
};
