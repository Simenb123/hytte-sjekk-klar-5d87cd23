
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { BookingFormData } from './types';

interface FormTextFieldProps {
  form: UseFormReturn<BookingFormData>;
  name: 'title' | 'description';
  label: string;
  placeholder: string;
  required?: boolean;
}

const FormTextField: React.FC<FormTextFieldProps> = ({
  form,
  name,
  label,
  placeholder,
  required = false
}) => {
  return (
    <FormField
      control={form.control}
      name={name}
      rules={required ? { required: `${label} er påkrevd` } : undefined}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormTextField;
