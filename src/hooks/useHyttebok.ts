import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DbHyttebokEntry } from '@/types/database.types';
import { useAuth } from '@/state/auth';

export const fetchHyttebokEntries = async (): Promise<DbHyttebokEntry[]> => {
  const { data, error } = await supabase
    .from('hyttebok_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchHyttebokEntries] Error:', error);
    throw error;
  }

  return (data || []) as DbHyttebokEntry[];
};

export const useHyttebokEntries = () => {
  return useQuery({
    queryKey: ['hyttebok_entries'],
    queryFn: fetchHyttebokEntries,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddHyttebokEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, { text: string }>({
    mutationFn: async ({ text }) => {
      if (!user) {
        throw new Error('Bruker ikke autentisert');
      }

      const { error } = await supabase.from('hyttebok_entries').insert({
        text,
        user_id: user.id,
      });

      if (error) {
        console.error('[useAddHyttebokEntry] Error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hyttebok_entries'] });
    },
  });
};
