import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, CalendarIcon, MapPin, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { Booking } from '@/hooks/useBookings';
import BookingFamilyMembers from './BookingFamilyMembers';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { getCategoriesSummary } from '@/services/checklist.service';
import { useAuth } from '@/hooks/useAuth';

interface BookingSectionsProps {
  bookings: Booking[];
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking?: (id: string) => void;
  showActions?: boolean;
  formatDate: (date: Date) => string;
  getBookingStatus: (startDate: Date, endDate: Date) => string;
  getChecklistCategory: (startDate: Date, endDate: Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const BookingProgress: React.FC<{ bookingId: string; category: string }> = ({ bookingId, category }) => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['bookingProgress', bookingId, category, user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('No user');
      return getCategoriesSummary(user.id, bookingId);
    },
    enabled: !!user?.id,
  });

  const progress = data?.[category]?.progress ?? 0;

  return (
    <div className="flex items-center gap-2 mt-2">
      <Progress value={progress} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  );
};

export const BookingSections: React.FC<BookingSectionsProps> = ({
  bookings,
  onEditBooking,
  onDeleteBooking,
  showActions = true,
  formatDate,
  getBookingStatus,
  getChecklistCategory,
  getStatusBadge
}) => {
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // Group and sort bookings
  const activeUpcomingBookings = bookings
    .filter(booking => {
      const status = getBookingStatus(booking.from, booking.to);
      return status === 'active' || status === 'upcoming';
    })
    .sort((a, b) => a.from.getTime() - b.from.getTime());

  const completedBookings = bookings
    .filter(booking => {
      const status = getBookingStatus(booking.from, booking.to);
      return status === 'completed';
    })
    .sort((a, b) => b.to.getTime() - a.to.getTime());

  const renderBooking = (booking: Booking) => {
    const status = getBookingStatus(booking.from, booking.to);
    const checklistCategory = getChecklistCategory(booking.from, booking.to);
    
    return (
      <Card key={booking.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{booking.title}</CardTitle>
              {booking.description && (
                <CardDescription className="mt-1">
                  {booking.description}
                </CardDescription>
              )}
            </div>
            {getStatusBadge(status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {formatDate(booking.from)} - {formatDate(booking.to)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Hytta</span>
            </div>
          </div>
          <BookingFamilyMembers familyMembers={booking.familyMembers || []} />
          <BookingProgress bookingId={booking.id} category={checklistCategory} />
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link to={`/checklist/${getChecklistCategory(booking.from, booking.to)}`} className="text-sm text-primary underline">
              Gå til sjekkliste
            </Link>
            {status === 'completed' && (
              <Link to="/hyttebok" className="text-sm text-purple-600 underline">
                Skriv i hytteboka
              </Link>
            )}
            {showActions && (
              <div className="ml-auto flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEditBooking(booking)}
                >
                  Rediger
                </Button>
                {onDeleteBooking && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (window.confirm('Er du sikker på at du vil slette denne bookingen?')) {
                        onDeleteBooking(booking.id);
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    Slett
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Active and Upcoming Bookings */}
      {activeUpcomingBookings.length > 0 && (
        <Collapsible open={activeExpanded} onOpenChange={setActiveExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              {activeExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Clock className="h-5 w-5 text-primary" />
              <span>Pågående og kommende bookinger</span>
              <Badge variant="secondary" className="ml-2">
                {activeUpcomingBookings.length}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {activeUpcomingBookings.map(renderBooking)}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Completed Bookings */}
      {completedBookings.length > 0 && (
        <Collapsible open={completedExpanded} onOpenChange={setCompletedExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              {completedExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span>Fullførte bookinger</span>
              <Badge variant="outline" className="ml-2">
                {completedBookings.length}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {completedBookings.map(renderBooking)}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};