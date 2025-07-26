
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserEmailField } from './UserEmailField';
import { ProfileFormFields } from './ProfileFormFields';
import { SubmitButton } from './SubmitButton';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
}

interface ProfileFormProps {
  user: User;
  profile: Profile | null;
  isSaving: boolean;
  onSubmit: (data: { first_name: string; last_name: string; phone: string; gender?: string; birth_date?: string }) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, profile, isSaving, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setGender(profile.gender || '');
      setBirthDate(profile.birth_date || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      first_name: firstName, 
      last_name: lastName, 
      phone,
      gender: gender || undefined,
      birth_date: birthDate || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <UserEmailField user={user} />
      
      <ProfileFormFields 
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        gender={gender}
        birthDate={birthDate}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onPhoneChange={setPhone}
        onGenderChange={setGender}
        onBirthDateChange={setBirthDate}
      />
      
      <SubmitButton isSaving={isSaving} />
    </form>
  );
};
