import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FamilyMember } from '@/types/family';
import { PrimaryLocation } from '@/types/inventory';
import { CategorySelector } from './CategorySelector';

interface NewInventoryItemFormProps {
  form: UseFormReturn<any>;
  familyMembers: FamilyMember[];
}

export const NewInventoryItemForm: React.FC<NewInventoryItemFormProps> = ({
  form,
  familyMembers,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Navn *</FormLabel>
            <FormControl>
              <Input placeholder="Navn på gjenstand..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="md:col-span-2">
        <CategorySelector form={form} />
      </div>

      <FormField
        control={form.control}
        name="primary_location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hovedlokasjon</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || 'hjemme'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Velg lokasjon" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="hjemme">Hjemme</SelectItem>
                <SelectItem value="hytta">På hytta</SelectItem>
                <SelectItem value="reiser">På reise</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="family_member_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Familiemedlem</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Velg familiemedlem" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">Ingen tilknytning</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.nickname || member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="brand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Merke</FormLabel>
            <FormControl>
              <Input placeholder="Merke..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Farge</FormLabel>
            <FormControl>
              <Input placeholder="Farge..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="size"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Størrelse</FormLabel>
            <FormControl>
              <Input placeholder="Størrelse..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Spesifikk lokasjon</FormLabel>
            <FormControl>
              <Input placeholder="F.eks. øverste hylle, under sengen..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="shelf"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hylle</FormLabel>
            <FormControl>
              <Input placeholder="Hylle nummer..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Textarea placeholder="Beskriv gjenstanden..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notater</FormLabel>
              <FormControl>
                <Textarea placeholder="Eventuelle notater..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};