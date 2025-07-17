import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { Booking } from '@/hooks/useBookings';

interface BookingStatusCardProps {
  booking: Booking;
  totalItems: number;
  completedItems: number;
  className?: string;
}

export const BookingStatusCard: React.FC<BookingStatusCardProps> = ({
  booking,
  totalItems,
  completedItems,
  className = ""
}) => {
  const now = new Date();
  const isActive = booking.from <= now && booking.to >= now;
  const isUpcoming = booking.from > now;
  const isPast = booking.to < now;
  
  const daysToStart = differenceInDays(booking.from, now);
  const daysToEnd = differenceInDays(booking.to, now);
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  const getStatusInfo = () => {
    if (isActive) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Pågående",
        variant: "default" as const,
        description: `Slutter om ${Math.abs(daysToEnd)} dag${Math.abs(daysToEnd) !== 1 ? 'er' : ''}`
      };
    } else if (isUpcoming) {
      return {
        icon: <Clock className="h-4 w-4" />,
        label: "Kommende",
        variant: "secondary" as const,
        description: `Starter om ${daysToStart} dag${daysToStart !== 1 ? 'er' : ''}`
      };
    } else {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Avsluttet",
        variant: "outline" as const,
        description: `Avsluttet for ${Math.abs(daysToEnd)} dag${Math.abs(daysToEnd) !== 1 ? 'er' : ''} siden`
      };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{booking.title}</CardTitle>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(booking.from, 'dd. MMM', { locale: nb })} - {format(booking.to, 'dd. MMM yyyy', { locale: nb })}
            </div>
            {booking.familyMembers && booking.familyMembers.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {booking.familyMembers.length} personer
              </div>
            )}
          </div>
          
          {booking.description && (
            <p className="text-sm text-muted-foreground">{booking.description}</p>
          )}
          
          <div className="text-sm text-muted-foreground">
            {statusInfo.description}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sjekkliste fremgang</span>
              <span className="font-medium">{progress}% ({completedItems}/{totalItems})</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};