
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BookingFormData } from '@/components/booking/types';

interface UseBookingFormProps {
  googleIntegration: boolean;
  sharedCalendarExists: boolean;
  isEditing: boolean;
  defaultValues?: Partial<BookingFormData>;
  onSubmit: (data: BookingFormData) => void;
}

export const useBookingForm = ({
  googleIntegration,
  sharedCalendarExists,
  isEditing,
  defaultValues,
  onSubmit
}: UseBookingFormProps) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<BookingFormData>({
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      startDate: defaultValues?.startDate || new Date(),
      endDate: defaultValues?.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      addToGoogle: defaultValues?.addToGoogle ?? googleIntegration,
      useSharedCalendar: defaultValues?.useSharedCalendar ?? sharedCalendarExists,
      familyMemberIds: defaultValues?.familyMemberIds || [],
    }
  });

  // Update form when props change
  useEffect(() => {
    form.setValue('addToGoogle', googleIntegration);
    form.setValue('useSharedCalendar', sharedCalendarExists);
  }, [googleIntegration, sharedCalendarExists, form]);

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue('startDate', date);
      
      // Auto-adjust end date if it's before the new start date
      const currentEndDate = form.getValues('endDate');
      if (currentEndDate <= date) {
        const newEndDate = new Date(date);
        newEndDate.setDate(date.getDate() + 1);
        form.setValue('endDate', newEndDate);
      }
      
      setStartDateOpen(false);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue('endDate', date);
      setEndDateOpen(false);
    }
  };

  const handleSubmit = (data: BookingFormData) => {
    console.log('Form submitted with data:', data);
    onSubmit(data);
  };

  return {
    form,
    startDateOpen,
    setStartDateOpen,
    endDateOpen,
    setEndDateOpen,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit
  };
};
