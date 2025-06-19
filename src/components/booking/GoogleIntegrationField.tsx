
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { BookingFormData } from './types';

interface GoogleIntegrationFieldProps {
  form: UseFormReturn<BookingFormData>;
  name: 'addToGoogle' | 'useSharedCalendar';
  label: string;
  description: string;
}

const GoogleIntegrationField: React.FC<GoogleIntegrationFieldProps> = ({
  form,
  name,
  label,
  description
}) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default GoogleIntegrationField;
