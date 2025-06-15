import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';

const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      name,
      description,
      created_at,
      user_id,
      brand,
      color,
      location,
      shelf,
      size,
      owner,
      notes,
      item_images ( image_url )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw new Error(error.message);
  }

  // The problematic join is removed, so we can return data directly.
  return data as InventoryItem[];
};

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });
};

export type NewInventoryItemData = {
  name: string;
  description?: string;
  image?: File;
  brand?: string;
  color?: string;
  location?: string;
  shelf?: string;
  size?: string;
  owner?: string;
  notes?: string;
};

export type UpdateInventoryItemData = NewInventoryItemData & {
  id: string;
};

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewInventoryItemData>({
    mutationFn: async (newItem) => {
      if (!user) throw new Error("User not authenticated");

      // 1. Insert item details
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .insert({ 
            name: newItem.name, 
            description: newItem.description, 
            user_id: user.id,
            brand: newItem.brand || null,
            color: newItem.color || null,
            location: newItem.location || null,
            shelf: newItem.shelf || null,
            size: newItem.size || null,
            owner: newItem.owner || null,
            notes: newItem.notes || null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // 2. Upload image if it exists
      if (newItem.image) {
        const fileExt = newItem.image.name.split('.').pop();
        const fileName = `${user.id}/${itemData.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('inventory_images')
          .upload(fileName, newItem.image);

        if (uploadError) throw uploadError;

        // 3. Get public URL and link image to item
        const { data: { publicUrl } } = supabase.storage.from('inventory_images').getPublicUrl(fileName);
        
        const { error: imageError } = await supabase
          .from('item_images')
          .insert({ item_id: itemData.id, image_url: publicUrl, user_id: user.id });

        if (imageError) throw imageError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, UpdateInventoryItemData>({
    mutationFn: async (itemToUpdate) => {
      if (!user) throw new Error("User not authenticated");

      const { id, image, ...itemDetails } = itemToUpdate;

      // 1. Update item details
      const { error: itemError } = await supabase
        .from('inventory_items')
        .update({
            name: itemDetails.name || null,
            description: itemDetails.description || null,
            brand: itemDetails.brand || null,
            color: itemDetails.color || null,
            location: itemDetails.location || null,
            shelf: itemDetails.shelf || null,
            size: itemDetails.size || null,
            owner: itemDetails.owner || null,
            notes: itemDetails.notes || null,
        })
        .eq('id', id);

      if (itemError) throw itemError;

      // 2. Handle image update if a new image is provided
      if (image) {
        // First, find old images to delete them
        const { data: oldImages, error: oldImagesError } = await supabase
          .from('item_images')
          .select('image_url')
          .eq('item_id', id);

        if (oldImagesError) console.error("Could not fetch old images to delete", oldImagesError);

        if (oldImages && oldImages.length > 0) {
            const oldImagePaths = oldImages.map(img => {
                const urlParts = img.image_url.split('/');
                return urlParts.slice(urlParts.indexOf('inventory_images') + 1).join('/');
            });
            // Delete old images from storage
            const { error: removeError } = await supabase.storage
              .from('inventory_images')
              .remove(oldImagePaths);

            if (removeError) console.error("Failed to remove old images from storage:", removeError);

            // Also delete from item_images table
            const { error: dbDeleteError } = await supabase
                .from('item_images')
                .delete()
                .eq('item_id', id);
            
            if (dbDeleteError) console.error("Failed to delete old image records from db:", dbDeleteError);
        }

        // Upload new image
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('inventory_images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        // Get public URL and link image to item
        const { data: { publicUrl } } = supabase.storage.from('inventory_images').getPublicUrl(fileName);
        
        const { error: imageError } = await supabase
          .from('item_images')
          .insert({ item_id: id, image_url: publicUrl, user_id: user.id });

        if (imageError) throw imageError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useBulkAddInventoryItems = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewInventoryItemData[]>({
    mutationFn: async (newItems) => {
      if (!user) throw new Error("User not authenticated");

      const itemsToInsert = newItems
        .filter(item => Object.values(item).some(val => val)) // Filter out completely empty rows
        .map(item => ({
          name: item.name || null,
          description: item.description || null,
          brand: item.brand || null,
          color: item.color || null,
          location: item.location || null,
          shelf: item.shelf || null,
          size: item.size || null,
          owner: item.owner || null,
          notes: item.notes || null,
          user_id: user.id,
        }));

      if (itemsToInsert.length === 0) {
        return;
      }

      const { error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
