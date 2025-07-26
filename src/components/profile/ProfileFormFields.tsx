
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileFormFieldsProps {
  firstName: string;
  lastName: string;
  phone: string;
  gender?: string;
  birthDate?: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onGenderChange?: (value: string) => void;
  onBirthDateChange?: (value: string) => void;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  firstName,
  lastName,
  phone,
  gender,
  birthDate,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onGenderChange,
  onBirthDateChange,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="firstName">Fornavn</Label>
        <Input 
          id="firstName" 
          value={firstName} 
          onChange={(e) => onFirstNameChange(e.target.value)}
          placeholder="Ditt fornavn"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lastName">Etternavn</Label>
        <Input 
          id="lastName" 
          value={lastName} 
          onChange={(e) => onLastNameChange(e.target.value)}
          placeholder="Ditt etternavn"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input 
          id="phone" 
          value={phone} 
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Ditt telefonnummer"
        />
      </div>
      
      {onGenderChange && (
        <div className="space-y-2">
          <Label htmlFor="gender">Kjønn</Label>
          <Select value={gender || ''} onValueChange={onGenderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Velg kjønn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mann">Mann</SelectItem>
              <SelectItem value="kvinne">Kvinne</SelectItem>
              <SelectItem value="annet">Annet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {onBirthDateChange && (
        <div className="space-y-2">
          <Label htmlFor="birthDate">Fødselsdato</Label>
          <Input 
            id="birthDate" 
            type="date"
            value={birthDate || ''} 
            onChange={(e) => onBirthDateChange(e.target.value)}
          />
        </div>
      )}
    </>
  );
};
