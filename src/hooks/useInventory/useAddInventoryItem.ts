import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/state/auth';
import { mapItemToRecord, NewInventoryItemData } from './types';

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewInventoryItemData>({
    mutationFn: async (newItem) => {
      if (!user) {
        console.error('[useAddInventoryItem] No authenticated user');
        throw new Error('Bruker ikke autentisert');
      }

      console.log('[useAddInventoryItem] Adding item for user:', user.id);

      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .insert(mapItemToRecord(newItem, user.id))
        .select()
        .single();

      if (itemError) {
        console.error('[useAddInventoryItem] Error inserting item:', itemError);
        throw new Error(`Kunne ikke legge til gjenstand: ${itemError.message}`);
      }

      console.log('[useAddInventoryItem] Item inserted successfully:', itemData.id);

      if (newItem.image) {
        console.log('[useAddInventoryItem] Uploading image');
        const fileExt = newItem.image.name.split('.').pop();
        const fileName = `${user.id}/${itemData.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('inventory_images')
          .upload(fileName, newItem.image);

        if (uploadError) {
          console.error('[useAddInventoryItem] Error uploading image:', uploadError);
          throw new Error(`Kunne ikke laste opp bilde: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from('inventory_images').getPublicUrl(fileName);

        const { error: imageError } = await supabase
          .from('item_images')
          .insert({ item_id: itemData.id, image_url: publicUrl, user_id: user.id });

        if (imageError) {
          console.error('[useAddInventoryItem] Error linking image:', imageError);
          throw new Error(`Kunne ikke knytte bilde til gjenstand: ${imageError.message}`);
        }

        console.log('[useAddInventoryItem] Image uploaded and linked successfully');
      }
    },
    onSuccess: () => {
      console.log('[useAddInventoryItem] Invalidating inventory queries');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('[useAddInventoryItem] Mutation error:', error);
    }
  });
};
