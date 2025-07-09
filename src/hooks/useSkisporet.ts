import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TrackStatus } from '@/types/skisporet';

export const fetchSkisporet = async (): Promise<TrackStatus> => {
  const { data, error } = await supabase.functions.invoke<TrackStatus>('skisporet-status');
  if (error) throw error;
  return data as TrackStatus;
};

export const useSkisporet = () =>
  useQuery({
    queryKey: ['skisporet'],
    queryFn: fetchSkisporet,
    staleTime: 5 * 60_000,
  });
