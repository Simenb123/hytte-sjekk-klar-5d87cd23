
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
}

interface GoogleEventsListProps {
  events: GoogleEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const GoogleEventsList: React.FC<GoogleEventsListProps> = ({
  events,
  isLoading,
  onRefresh
}) => {
  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : events.length > 0 ? (
        events.map(event => (
          <div key={event.id} className="mb-4 p-3 border rounded-lg">
            <div className="font-medium">{event.summary}</div>
            <div className="text-sm text-gray-500">
              {new Date(event.start.dateTime).toLocaleString('no')} - {new Date(event.end.dateTime).toLocaleString('no')}
            </div>
            {event.description && (
              <div className="text-sm text-gray-600 mt-1">
                {event.description}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 my-4">
          Ingen hendelser funnet i Google Calendar
        </div>
      )}
      
      <Button 
        onClick={onRefresh} 
        className="w-full mt-3"
      >
        Oppdater Google Calendar
      </Button>
    </div>
  );
};
