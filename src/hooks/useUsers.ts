import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      try {
        // Fetch from profiles table to get user info accessible from client
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');
        
        if (error) {
          console.error('Error fetching users:', error);
          return [];
        }

        if (!data) {
          return [];
        }

        // Map to display format with full name as "email"
        return data.map(profile => {
          const firstName = profile.first_name?.trim() || '';
          const lastName = profile.last_name?.trim() || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          return {
            id: profile.id,
            email: fullName || 'Ukjent bruker'
          };
        });
      } catch (error) {
        console.error('Error in useUsers:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}