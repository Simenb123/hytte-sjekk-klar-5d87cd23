import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { Booking } from '@/hooks/useBookings';

interface BookingSelectorProps {
  selectedBooking: Booking | null;
  availableBookings: Booking[];
  onBookingSelect: (booking: Booking | null) => void;
  onStartNewChecklist: () => void;
  className?: string;
}

export const BookingSelector: React.FC<BookingSelectorProps> = ({
  selectedBooking,
  availableBookings,
  onBookingSelect,
  onStartNewChecklist,
  className = ""
}) => {
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Velg booking for sjekkliste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableBookings.length > 0 ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Aktuelle bookinger:</label>
              <Select
                value={selectedBooking?.id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    onBookingSelect(null);
                  } else {
                    const booking = availableBookings.find(b => b.id === value);
                    onBookingSelect(booking || null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg en booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen spesifikk booking</SelectItem>
                  {availableBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(booking.from, 'dd. MMM', { locale: nb })} - {format(booking.to, 'dd. MMM yyyy', { locale: nb })}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedBooking && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">{selectedBooking.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(selectedBooking.from, 'dd. MMM', { locale: nb })} - {format(selectedBooking.to, 'dd. MMM yyyy', { locale: nb })}
                  </div>
                  {selectedBooking.familyMembers && selectedBooking.familyMembers.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedBooking.familyMembers.length} personer
                    </div>
                  )}
                </div>
                {selectedBooking.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedBooking.description}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Ingen aktuelle bookinger funnet</p>
            <Button onClick={onStartNewChecklist}>
              Start generell sjekkliste
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};