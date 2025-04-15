
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input 
          id="email" 
          value={user?.email || ''} 
          disabled 
          className="bg-gray-100"
        />
        <p className="text-xs text-gray-500">E-post kan ikke endres</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="firstName">Fornavn</Label>
        <Input 
          id="firstName" 
          value={firstName} 
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Ditt fornavn"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="lastName">Etternavn</Label>
        <Input 
          id="lastName" 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Ditt etternavn"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input 
          id="phone" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ditt telefonnummer"
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Lagrer...
          </>
        ) : 'Lagre endringer'}
      </Button>
    </form>
  );
};
