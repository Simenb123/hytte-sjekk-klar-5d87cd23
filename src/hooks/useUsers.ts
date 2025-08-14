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
        // Use secure function instead of direct table access
        const { data, error } = await supabase
          .rpc('get_users_for_family_linking');
        
        if (error) {
          console.error('Error fetching users:', error);
          return [];
        }

        if (!data) {
          return [];
        }

        // Map to expected format
        return data.map(user => ({
          id: user.id,
          email: user.display_name
        }));
      } catch (error) {
        console.error('Error in useUsers:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}