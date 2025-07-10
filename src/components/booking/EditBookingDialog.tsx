
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BookingForm from './BookingForm';
import { BookingFormData } from './types';
import { Booking } from '@/hooks/useBookings';
import { toast } from 'sonner';

type EditBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onUpdate: (id: string, updates: Partial<Booking>) => Promise<boolean>;
  googleIntegration?: boolean;
  sharedCalendarExists?: boolean;
};

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({ 
  open, 
  onOpenChange,
  booking,
  onUpdate,
  googleIntegration = false,
  sharedCalendarExists = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultValues, setDefaultValues] = useState<BookingFormData | null>(null);
  
  useEffect(() => {
    if (booking) {
      // Convert booking to form data format when booking changes
      const startDate = new Date(booking.from);
      const endDate = new Date(booking.to);
      
      console.log('EditBookingDialog - Setting default values with dates:', { 
        startDate, 
        endDate, 
        booking 
      });
      
      setDefaultValues({
        title: booking.title,
        description: booking.description || '',
        startDate,
        endDate,
        addToGoogle: false,
        useSharedCalendar: false,
        familyMemberIds: []
      });
    }
  }, [booking]);
  
  if (!booking || !defaultValues) return null;

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting update with data:", data);
      
      if (!data.title) {
        toast.error('Booking må ha en tittel');
        setIsSubmitting(false);
        return;
      }
      
      if (!data.startDate || !data.endDate) {
        toast.error('Booking må ha start- og sluttdato');
        setIsSubmitting(false);
        return;
      }
      
      if (data.endDate < data.startDate) {
        toast.error('Sluttdato kan ikke være før startdato');
        setIsSubmitting(false);
        return;
      }
      
      // Convert to proper Date objects if needed
      const startDate = data.startDate instanceof Date ? 
        data.startDate : new Date(data.startDate);
      
      const endDate = data.endDate instanceof Date ? 
        data.endDate : new Date(data.endDate);
      
      const updates = {
        title: data.title,
        description: data.description || '',
        from: startDate,
        to: endDate
      };
      
      const success = await onUpdate(booking.id, updates);
      
      if (success) {
        toast.success('Booking oppdatert!');
        onOpenChange(false);
      }
    } catch (error: unknown) {
      console.error('Error updating booking:', error);
      const message = error instanceof Error ? error.message : 'Ukjent feil';
      toast.error(`Kunne ikke oppdatere booking: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Endre booking</DialogTitle>
          <DialogDescription>
            Gjør endringer i bookingen og klikk lagre når du er ferdig.
          </DialogDescription>
        </DialogHeader>
        
        <BookingForm 
          onSubmit={handleSubmit}
          googleIntegration={googleIntegration}
          sharedCalendarExists={sharedCalendarExists}
          isEditing={true}
          defaultValues={defaultValues}
          submitLabel="Lagre endringer"
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
