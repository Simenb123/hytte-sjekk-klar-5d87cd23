import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

/** React context used to provide authentication state throughout the app */
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
