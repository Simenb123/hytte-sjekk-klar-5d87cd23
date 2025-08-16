
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink } from 'lucide-react';
import { formatGoogleEventDate } from './utils';
import { GoogleEvent } from '@/types/googleCalendar.types';

interface EventListItemProps {
  event: GoogleEvent;
}

export const EventListItem: React.FC<EventListItemProps> = ({ event }) => {
  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
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
          {formatGoogleEventDate(event.start.dateTime, event.start.date)}
        </Badge>
        <span className="mx-1">→</span>
        <Badge variant="outline" className="bg-gray-50">
          {formatGoogleEventDate(event.end.dateTime, event.end.date)}
        </Badge>
      </div>
      
      {event.description && (
        <div className="text-sm text-gray-600 mt-2 ml-6 border-t pt-2 border-gray-100">
          {event.description}
        </div>
      )}
    </div>
  );
};
