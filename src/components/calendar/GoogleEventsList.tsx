
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, ExternalLink, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return dateString;
      }
      
      // Format date to Norwegian locale
      return date.toLocaleString('nb-NO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
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
          
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                <div className="font-medium flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-800">{event.summary}</span>
                  </div>
                  {event.htmlLink && (
                    <a 
                      href={event.htmlLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:text-blue-700 flex items-center ml-2"
                    >
                      <span className="text-xs mr-1 hidden sm:inline">Åpne</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 mt-2 ml-6">
                  <Badge variant="outline" className="mr-2 bg-gray-50">
                    {formatDate(event.start.dateTime)}
                  </Badge>
                  <span className="mx-1">→</span>
                  <Badge variant="outline" className="bg-gray-50">
                    {formatDate(event.end.dateTime)}
                  </Badge>
                </div>
                
                {event.description && (
                  <div className="text-sm text-gray-600 mt-2 ml-6 border-t pt-2 border-gray-100">
                    {event.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 my-8 py-6 border border-dashed rounded-lg">
          <div className="mb-2">Ingen hendelser funnet i Google Calendar</div>
          <div className="text-sm">Sync med Google Calendar for å se hendelser her</div>
        </div>
      )}
      
      <Button 
        onClick={handleRefresh} 
        disabled={isLoading}
        className="w-full mt-5"
        variant="outline"
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
