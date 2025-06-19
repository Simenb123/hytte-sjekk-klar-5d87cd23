
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { BookingConflict } from '@/hooks/useBookingConflicts';

interface BookingConflictAlertProps {
  conflicts: BookingConflict[];
}

const BookingConflictAlert: React.FC<BookingConflictAlertProps> = ({ conflicts }) => {
  if (conflicts.length === 0) return null;

  const getOverlapText = (overlap: BookingConflict['overlaps']) => {
    switch (overlap) {
      case 'start':
        return 'starter før denne bookingen slutter';
      case 'end':
        return 'slutter etter denne bookingen starter';
      case 'complete':
        return 'overlapper helt med denne bookingen';
      case 'contains':
        return 'inneholder denne bookingen';
      default:
        return 'overlapper med denne bookingen';
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">
            {conflicts.length === 1 
              ? 'Det er en booking-konflikt:' 
              : `Det er ${conflicts.length} booking-konflikter:`
            }
          </p>
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="flex items-start gap-2 text-sm">
              <Calendar className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">{conflict.title}</span>
                <span className="text-muted-foreground ml-1">
                  ({format(conflict.startDate, 'dd.MM.yyyy', { locale: nb })} - {format(conflict.endDate, 'dd.MM.yyyy', { locale: nb })})
                </span>
                <br />
                <span className="text-xs text-muted-foreground">
                  Din booking {getOverlapText(conflict.overlaps)}
                </span>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-2">
            Du kan fortsatt opprette bookingen, men vær oppmerksom på konflikten.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default BookingConflictAlert;
