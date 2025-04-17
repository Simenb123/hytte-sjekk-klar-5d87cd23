
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useBookingForm } from '@/hooks/useBookingForm';
import FormTextField from './FormTextField';
import FormDateField from './FormDateField';
import GoogleIntegrationField from './GoogleIntegrationField';
import { BookingFormData } from './types';

type BookingFormProps = {
  onSubmit: (data: BookingFormData) => void;
  googleIntegration: boolean;
  sharedCalendarExists: boolean;
  isEditing?: boolean;
  defaultValues?: Partial<BookingFormData>;
  submitLabel?: string;
  isSubmitting?: boolean;
};

const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  googleIntegration,
  sharedCalendarExists,
  isEditing = false,
  defaultValues,
  submitLabel = 'Opprett booking',
  isSubmitting = false
}) => {
  const {
    form,
    startDateOpen,
    setStartDateOpen,
    endDateOpen,
    setEndDateOpen,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit
  } = useBookingForm({
    googleIntegration,
    sharedCalendarExists,
    isEditing,
    defaultValues,
    onSubmit
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormTextField
          form={form}
          name="title"
          label="Tittel"
          placeholder="F.eks. Påskeferie"
          required
        />
        
        <FormTextField
          form={form}
          name="description"
          label="Beskrivelse (valgfritt)"
          placeholder="Legg til mer informasjon"
        />

        <FormDateField
          form={form}
          name="startDate"
          label="Fra dato"
          isOpen={startDateOpen}
          setIsOpen={setStartDateOpen}
          onSelect={handleStartDateChange}
          minDate={!isEditing ? new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
        />

        <FormDateField
          form={form}
          name="endDate"
          label="Til dato"
          isOpen={endDateOpen}
          setIsOpen={setEndDateOpen}
          onSelect={handleEndDateChange}
          minDate={form.getValues('startDate')}
        />

        {!isEditing && googleIntegration && (
          <>
            <GoogleIntegrationField
              form={form}
              name="addToGoogle"
              label="Legg til i Google Calendar"
              description="Bookingen vil også bli lagt til i din Google Calendar"
            />
            
            {sharedCalendarExists && form.watch("addToGoogle") && (
              <GoogleIntegrationField
                form={form}
                name="useSharedCalendar"
                label="Bruk felles hytte-kalender"
                description="Legg til i den delte hytte-kalenderen som alle familiemedlemmer har tilgang til"
              />
            )}
          </>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Lagrer...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default BookingForm;
