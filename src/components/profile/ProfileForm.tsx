
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
}

interface ProfileFormProps {
  user: User;
  profile: Profile | null;
  isSaving: boolean;
  onSubmit: (data: { first_name: string; last_name: string; phone: string }) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, profile, isSaving, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ first_name: firstName, last_name: lastName, phone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <UserEmailField user={user} />
      
      <ProfileFormFields 
        firstName={firstName}
        lastName={lastName}
        phone={phone}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onPhoneChange={setPhone}
      />
      
      <SubmitButton isSaving={isSaving} />
    </form>
  );
};
