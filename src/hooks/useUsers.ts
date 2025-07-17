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
      // Fetch from profiles table to get user info accessible from client
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      // Map to display format with full name as "email"
      return data.map(profile => ({
        id: profile.id,
        email: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Ukjent bruker'
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}