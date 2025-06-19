
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { BookingFormData } from './types';

interface FamilyMemberSelectorProps {
  form: UseFormReturn<BookingFormData>;
}

const FamilyMemberSelector: React.FC<FamilyMemberSelectorProps> = ({ form }) => {
  const { data: familyMembers, isLoading } = useFamilyMembers();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <FormLabel>Familiemedlemmer</FormLabel>
        <p className="text-sm text-gray-500">Laster familiemedlemmer...</p>
      </div>
    );
  }

  if (!familyMembers || familyMembers.length === 0) {
    return (
      <div className="space-y-2">
        <FormLabel>Familiemedlemmer</FormLabel>
        <p className="text-sm text-gray-500">
          Ingen familiemedlemmer registrert. Legg til familiemedlemmer i Familie-seksjonen først.
        </p>
      </div>
    );
  }

  return (
    <FormField
      control={form.control}
      name="familyMemberIds"
      render={() => (
        <FormItem>
          <FormLabel>Familiemedlemmer som skal være med</FormLabel>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {familyMembers.map((member) => (
              <FormField
                key={member.id}
                control={form.control}
                name="familyMemberIds"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={member.id}
                      className="flex flex-row items-center space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(member.id)}
                          onCheckedChange={(checked) => {
                            const currentValue = field.value || [];
                            if (checked) {
                              field.onChange([...currentValue, member.id]);
                            } else {
                              field.onChange(
                                currentValue.filter((value) => value !== member.id)
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <div className="grid gap-1.5 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {member.name}
                          {member.nickname && (
                            <span className="text-gray-500 ml-1">({member.nickname})</span>
                          )}
                        </FormLabel>
                        {member.role && (
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        )}
                      </div>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FamilyMemberSelector;
