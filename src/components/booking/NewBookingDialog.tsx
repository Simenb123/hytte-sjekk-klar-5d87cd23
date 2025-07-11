
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BookingForm from './BookingForm';
import { useBookingSubmit } from './useBookingSubmit';
import { useAuth } from '@/state/auth';
import { toast } from 'sonner';
import type { BookingFormData } from './types';

type NewBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (booking: BookingFormData) => void;
  googleIntegration?: boolean;
  sharedCalendarExists?: boolean;
};

const NewBookingDialog: React.FC<NewBookingDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  googleIntegration = false,
  sharedCalendarExists = false
}) => {
  const { user } = useAuth();
  const lastSubmittedData = React.useRef<BookingFormData | null>(null);

  const { submitBooking, isSubmitting } = useBookingSubmit({
    onSuccess: () => {
      if (lastSubmittedData.current) {
        onSuccess(lastSubmittedData.current);
        lastSubmittedData.current = null;
      }
      onOpenChange(false);
    }
  });
  
  const handleFormSubmit = (data: BookingFormData) => {
    console.log("NewBookingDialog - Form submitted with data:", data);
    if (!user) {
      toast.error('Du må være logget inn for å lage en booking');
      return;
    }
    
    if (!data.title) {
      toast.error('Booking må ha en tittel');
      return;
    }
    
    if (!data.startDate || !data.endDate) {
      toast.error('Booking må ha start- og sluttdato');
      return;
    }
    
    if (data.endDate < data.startDate) {
      toast.error('Sluttdato kan ikke være før startdato');
      return;
    }
    
    lastSubmittedData.current = data;
    submitBooking(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ny booking</DialogTitle>
          <DialogDescription>
            Fyll ut informasjonen under for å booke hytta.
          </DialogDescription>
        </DialogHeader>
        
        <BookingForm 
          onSubmit={handleFormSubmit}
          googleIntegration={googleIntegration}
          sharedCalendarExists={sharedCalendarExists}
          submitLabel="Opprett booking"
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewBookingDialog;
