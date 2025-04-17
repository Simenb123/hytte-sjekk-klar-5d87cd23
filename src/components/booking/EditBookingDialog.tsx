
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BookingForm, { BookingFormData } from './BookingForm';
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
  
  if (!booking) return null;

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting update with data:", data);
      
      const updates = {
        title: data.title,
        description: data.description || '',
        from: data.startDate,
        to: data.endDate
      };
      
      const success = await onUpdate(booking.id, updates);
      
      if (success) {
        toast.success('Booking oppdatert!');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error(`Kunne ikke oppdatere booking: ${error.message || 'Ukjent feil'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert booking to form data format
  const defaultValues: BookingFormData = {
    title: booking.title,
    description: booking.description || '',
    startDate: booking.from,
    endDate: booking.to,
    addToGoogle: false,
    useSharedCalendar: false
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
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
