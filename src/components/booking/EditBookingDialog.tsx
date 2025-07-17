
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
import { useBookingSubmit } from './useBookingSubmit';
import { toast } from 'sonner';

type EditBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess?: () => void;
  googleIntegration?: boolean;
  sharedCalendarExists?: boolean;
};

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({ 
  open, 
  onOpenChange,
  booking,
  onSuccess,
  googleIntegration = false,
  sharedCalendarExists = false
}) => {
  const [defaultValues, setDefaultValues] = useState<BookingFormData | null>(null);
  const { updateBooking, isSubmitting } = useBookingSubmit({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    }
  });
  
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
        familyMemberIds: booking.familyMembers?.map(fm => fm.id) || []
      });
    }
  }, [booking]);
  
  if (!booking || !defaultValues) return null;

  const handleSubmit = async (data: BookingFormData) => {
    if (!booking) return;
    
    console.log("Submitting update with data:", data);
    
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
    
    await updateBooking(booking.id, data);
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
