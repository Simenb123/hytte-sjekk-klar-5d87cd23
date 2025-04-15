
import React from 'react';
import { User } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserEmailFieldProps {
  user: User;
}

export const UserEmailField: React.FC<UserEmailFieldProps> = ({ user }) => {
  return (
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
  );
};
