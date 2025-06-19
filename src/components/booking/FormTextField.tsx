
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookingFormData } from './types';

interface FormTextFieldProps {
  form: UseFormReturn<BookingFormData>;
  name: 'title' | 'description';
  label: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}

const FormTextField: React.FC<FormTextFieldProps> = ({
  form,
  name,
  label,
  placeholder,
  multiline = false,
  required = false
}) => {
  return (
    <FormField
      control={form.control}
      name={name}
      rules={required ? { required: `${label} er påkrevd` } : undefined}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} {required && '*'}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea 
                placeholder={placeholder}
                rows={3}
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            ) : (
              <Input 
                placeholder={placeholder} 
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormTextField;
