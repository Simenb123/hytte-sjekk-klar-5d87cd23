
import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Booking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BookingListItemProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

const BookingListItem: React.FC<BookingListItemProps> = ({ 
  booking, 
  onEdit, 
  onDelete 
}) => {
  const formatDate = (date: Date) => {
    return format(date, 'PPP', { locale: nb });
  };
  
  const handleDelete = () => {
    if (window.confirm('Er du sikker på at du vil slette denne bookingen?')) {
      onDelete(booking.id);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.title}</CardTitle>
            <CardDescription>
              {formatDate(booking.from)} - {formatDate(booking.to)}
            </CardDescription>
          </div>
          {booking.googleEventId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Synkronisert med Google Calendar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      {booking.description && (
        <CardContent className="pt-0 pb-2">
          <p className="text-sm text-gray-600">{booking.description}</p>
        </CardContent>
      )}
      
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(booking)}
        >
          <Edit className="h-4 w-4 mr-1" /> Rediger
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Slett
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingListItem;
