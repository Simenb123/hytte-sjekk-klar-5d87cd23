import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/state/auth';
import { mapItemToRecord, NewInventoryItemData } from './types';

export const useBulkAddInventoryItems = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewInventoryItemData[]>({
    mutationFn: async (newItems) => {
      if (!user) {
        console.error('[useBulkAddInventoryItems] No authenticated user');
        throw new Error('Bruker ikke autentisert');
      }

      console.log('[useBulkAddInventoryItems] Adding', newItems.length, 'items for user:', user.id);

      const itemsToInsert = newItems
        .filter(item => Object.values(item).some(val => val))
        .map(item => mapItemToRecord(item, user.id));

      if (itemsToInsert.length === 0) {
        console.log('[useBulkAddInventoryItems] No valid items to insert');
        return;
      }

      console.log('[useBulkAddInventoryItems] Inserting', itemsToInsert.length, 'filtered items');

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) {
        console.error('[useBulkAddInventoryItems] Error bulk inserting items:', error);
        throw new Error(`Kunne ikke legge til gjenstander: ${error.message}`);
      }

      console.log('[useBulkAddInventoryItems] Bulk insert successful');
    },
    onSuccess: () => {
      console.log('[useBulkAddInventoryItems] Invalidating inventory queries');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('[useBulkAddInventoryItems] Mutation error:', error);
    }
  });
};
