import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteInventoryItem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.id) {
        throw new Error('Du må være logget inn for å slette en gjenstand');
      }

      console.log('[useDeleteInventoryItem] Deleting item:', itemId);

      // First delete associated images
      const { error: imagesError } = await supabase
        .from('item_images')
        .delete()
        .eq('item_id', itemId);

      if (imagesError) {
        console.error('[useDeleteInventoryItem] Error deleting images:', imagesError);
        throw new Error(`Kunne ikke slette bilder: ${imagesError.message}`);
      }

      // Then delete the inventory item
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useDeleteInventoryItem] Error deleting item:', error);
        throw new Error(`Kunne ikke slette gjenstand: ${error.message}`);
      }

      console.log('[useDeleteInventoryItem] Successfully deleted item');
      return itemId;
    },
    onSuccess: () => {
      // Invalidate inventory queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Gjenstand slettet!');
    },
    onError: (error: Error) => {
      console.error('[useDeleteInventoryItem] Mutation error:', error);
      toast.error(error.message || 'Kunne ikke slette gjenstand');
    },
  });
};