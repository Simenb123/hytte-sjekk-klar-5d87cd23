
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string, 
    password: string, 
    metadata?: { 
      first_name?: string, 
      last_name?: string, 
      phone?: string 
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        console.log('[AuthContext] Setting up auth...');
        
        // Set up the auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('[AuthContext] Auth state changed:', event, {
              userId: currentSession?.user?.id,
              hasSession: !!currentSession
            });
            
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (event === 'SIGNED_IN') {
              console.log('[AuthContext] User signed in successfully');
              toast.success('Du er nå logget inn!');
              // Clear any cached data and force refresh
              window.location.reload();
            } else if (event === 'SIGNED_OUT') {
              console.log('[AuthContext] User signed out');
              toast.info('Du er nå logget ut');
              // Clear any cached data
              localStorage.clear();
              sessionStorage.clear();
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('[AuthContext] Token refreshed for user:', currentSession?.user?.id);
            }
          }
        );

        // Then check for existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
        } else {
          console.log('[AuthContext] Initial session check:', {
            userId: currentSession?.user?.id,
            hasSession: !!currentSession,
            accessToken: currentSession?.access_token?.substring(0, 20) + '...'
          });
          
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
        
        setIsLoading(false);

        return () => {
          console.log('[AuthContext] Cleaning up auth subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AuthContext] Setup error:', error);
        setIsLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting to sign in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[AuthContext] Sign in successful for user:', data.user?.id);
    } catch (error: any) {
      console.error('[AuthContext] Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { 
      first_name?: string, 
      last_name?: string, 
      phone?: string 
    }
  ) => {
    try {
      console.log('[AuthContext] Attempting to sign up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: {
          data: {
            first_name: metadata?.first_name,
            last_name: metadata?.last_name,
            phone: metadata?.phone
          }
        }
      });
      
      if (error) {
        console.error('[AuthContext] Sign up error:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[AuthContext] Sign up successful for user:', data.user?.id);
    } catch (error: any) {
      console.error('[AuthContext] Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Attempting to sign out user:', user?.id);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[AuthContext] Sign out successful');
    } catch (error: any) {
      console.error('[AuthContext] Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        signOut,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
