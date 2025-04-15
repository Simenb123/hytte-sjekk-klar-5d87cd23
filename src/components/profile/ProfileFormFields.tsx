
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormFieldsProps {
  firstName: string;
  lastName: string;
  phone: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  firstName,
  lastName,
  phone,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
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
    </>
  );
};
