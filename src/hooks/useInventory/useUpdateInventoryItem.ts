import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mapItemToRecord, UpdateInventoryItemData } from './types';

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, UpdateInventoryItemData>({
    mutationFn: async (itemToUpdate) => {
      if (!user) {
        console.error('[useUpdateInventoryItem] No authenticated user');
        throw new Error('Bruker ikke autentisert');
      }

      console.log('[useUpdateInventoryItem] Updating item:', itemToUpdate.id, 'for user:', user.id);

      const { id, image, ...itemDetails } = itemToUpdate;

      const { error: itemError } = await supabase
        .from('inventory_items')
        .update(mapItemToRecord(itemDetails, undefined, null))
        .eq('id', id)
        .eq('user_id', user.id);

      if (itemError) {
        console.error('[useUpdateInventoryItem] Error updating item:', itemError);
        throw new Error(`Kunne ikke oppdatere gjenstand: ${itemError.message}`);
      }

      console.log('[useUpdateInventoryItem] Item updated successfully');

      if (image) {
        console.log('[useUpdateInventoryItem] Updating image');

        const { data: oldImages, error: oldImagesError } = await supabase
          .from('item_images')
          .select('image_url')
          .eq('item_id', id)
          .eq('user_id', user.id);

        if (oldImagesError) {
          console.error('[useUpdateInventoryItem] Could not fetch old images to delete:', oldImagesError);
        }

        if (oldImages && oldImages.length > 0) {
          const oldImagePaths = oldImages.map(img => {
            const urlParts = img.image_url.split('/');
            return urlParts.slice(urlParts.indexOf('inventory_images') + 1).join('/');
          });
          const { error: removeError } = await supabase.storage
            .from('inventory_images')
            .remove(oldImagePaths);

          if (removeError) {
            console.error('[useUpdateInventoryItem] Failed to remove old images from storage:', removeError);
          }

          const { error: dbDeleteError } = await supabase
            .from('item_images')
            .delete()
            .eq('item_id', id)
            .eq('user_id', user.id);

          if (dbDeleteError) {
            console.error('[useUpdateInventoryItem] Failed to delete old image records from db:', dbDeleteError);
          }
        }

        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('inventory_images')
          .upload(fileName, image);

        if (uploadError) {
          console.error('[useUpdateInventoryItem] Error uploading new image:', uploadError);
          throw new Error(`Kunne ikke laste opp nytt bilde: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from('inventory_images').getPublicUrl(fileName);

        const { error: imageError } = await supabase
          .from('item_images')
          .insert({ item_id: id, image_url: publicUrl, user_id: user.id });

        if (imageError) {
          console.error('[useUpdateInventoryItem] Error linking new image:', imageError);
          throw new Error(`Kunne ikke knytte nytt bilde til gjenstand: ${imageError.message}`);
        }

        console.log('[useUpdateInventoryItem] Image updated successfully');
      }
    },
    onSuccess: () => {
      console.log('[useUpdateInventoryItem] Invalidating inventory queries');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('[useUpdateInventoryItem] Mutation error:', error);
    }
  });
};
