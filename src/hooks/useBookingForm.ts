
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { addDays, parseISO } from 'date-fns';
import { BookingFormData } from '@/components/booking/types';

interface UseBookingFormProps {
  googleIntegration: boolean;
  sharedCalendarExists: boolean;
  isEditing?: boolean;
  defaultValues?: Partial<BookingFormData>;
  onSubmit: (data: BookingFormData) => void;
}

export const useBookingForm = ({
  googleIntegration,
  sharedCalendarExists,
  isEditing = false,
  defaultValues,
  onSubmit,
}: UseBookingFormProps) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  // Ensure default values are proper Date objects
  const processedDefaultValues = defaultValues ? {
    ...defaultValues,
    startDate: defaultValues.startDate instanceof Date ? 
      defaultValues.startDate : 
      (typeof defaultValues.startDate === 'string' ? parseISO(defaultValues.startDate) : today),
    endDate: defaultValues.endDate instanceof Date ? 
      defaultValues.endDate : 
      (typeof defaultValues.endDate === 'string' ? parseISO(defaultValues.endDate) : tomorrow)
  } : {
    title: '',
    description: '',
    startDate: today,
    endDate: tomorrow,
    addToGoogle: googleIntegration,
    useSharedCalendar: sharedCalendarExists
  };
  
  const form = useForm<BookingFormData>({
    defaultValues: processedDefaultValues
  });

  // Update form when props change
  useEffect(() => {
    if (!isEditing) {
      form.setValue('addToGoogle', googleIntegration);
      form.setValue('useSharedCalendar', sharedCalendarExists);
    }
  }, [googleIntegration, sharedCalendarExists, form, isEditing]);

  // Handle date changes to ensure end date is after start date
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    form.setValue('startDate', date);
    setStartDateOpen(false);
    
    // If end date is before start date, update end date
    const currentEndDate = form.getValues('endDate');
    if (date > currentEndDate) {
      form.setValue('endDate', addDays(date, 1));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    form.setValue('endDate', date);
    setEndDateOpen(false);
  };

  const handleSubmit = (data: BookingFormData) => {
    // Ensure end date is not before start date
    if (data.endDate < data.startDate) {
      data.endDate = addDays(data.startDate, 1);
    }
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
