import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/state/auth';
import { fetchInventory } from './fetchInventory';

export const useInventory = () => {
  const { user, session } = useAuth();

  console.log('[useInventory] Hook called with user:', user?.id, 'session exists:', !!session);

  const result = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: () => fetchInventory(user?.id),
    enabled: !!user?.id && !!session,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    networkMode: 'online',
  });

  console.log('[useInventory] Query state:', {
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isStale: result.isStale,
    dataUpdatedAt: result.dataUpdatedAt,
    errorUpdatedAt: result.errorUpdatedAt,
    itemsCount: result.data?.length || 0,
    hasError: !!result.error
  });

  if (result.error) {
    console.error('[useInventory] Query error:', result.error);
  }

  if (result.data) {
    console.log('[useInventory] Query success, items count:', result.data.length);
    console.log('[useInventory] Sample item:', result.data[0]);
  }

  if (result.isLoading) {
    console.log('[useInventory] Query is loading...');
  }

  return result;
};
