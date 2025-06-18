
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';

const fetchInventory = async (userId?: string): Promise<InventoryItem[]> => {
  console.log('[useInventory] Fetching inventory for user:', userId);
  
  if (!userId) {
    console.log('[useInventory] No user ID provided, returning empty array');
    return [];
  }

  try {
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
        category,
        family_member_id,
        item_images ( image_url ),
        family_members ( id, name, nickname )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useInventory] Error fetching inventory:', error);
      throw new Error(`Kunne ikke hente inventar: ${error.message}`);
    }

    const processedData = (data || []).map(item => ({
      ...item,
      // Ensure all fields have proper fallback values
      name: item.name || '',
      description: item.description || null,
      brand: item.brand || null,
      color: item.color || null,
      location: item.location || null,
      shelf: item.shelf || null,
      size: item.size || null,
      owner: item.owner || null,
      notes: item.notes || null,
      category: item.category || null,
      family_member_id: item.family_member_id || null,
      item_images: item.item_images || [],
      family_members: item.family_members || null
    }));

    console.log('[useInventory] Successfully fetched and processed', processedData.length, 'items');
    return processedData as InventoryItem[];
  } catch (error) {
    console.error('[useInventory] Fetch error:', error);
    throw error;
  }
};

export const useInventory = () => {
  const { user, session } = useAuth();
  
  console.log('[useInventory] Hook called with user:', user?.id, 'session exists:', !!session);

  const result = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: () => fetchInventory(user?.id),
    enabled: !!user?.id && !!session,
    retry: 2,
    staleTime: 1000 * 60 * 10, // 10 minutes - longer stale time for stability
    gcTime: 1000 * 60 * 30, // 30 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchInterval: false,
    // Add network mode for better offline handling
    networkMode: 'online',
  });

  // Enhanced logging
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
  category?: string;
  family_member_id?: string;
};

export type UpdateInventoryItemData = NewInventoryItemData & {
  id: string;
};

export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewInventoryItemData>({
    mutationFn: async (newItem) => {
      if (!user) {
        console.error('[useAddInventoryItem] No authenticated user');
        throw new Error("Bruker ikke autentisert");
      }

      console.log('[useAddInventoryItem] Adding item for user:', user.id);

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
            category: newItem.category || 'Annet',
            family_member_id: newItem.family_member_id || null,
        })
        .select()
        .single();

      if (itemError) {
        console.error('[useAddInventoryItem] Error inserting item:', itemError);
        throw new Error(`Kunne ikke legge til gjenstand: ${itemError.message}`);
      }

      console.log('[useAddInventoryItem] Item inserted successfully:', itemData.id);

      // 2. Upload image if it exists
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

        // 3. Get public URL and link image to item
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

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, UpdateInventoryItemData>({
    mutationFn: async (itemToUpdate) => {
      if (!user) {
        console.error('[useUpdateInventoryItem] No authenticated user');
        throw new Error("Bruker ikke autentisert");
      }

      console.log('[useUpdateInventoryItem] Updating item:', itemToUpdate.id, 'for user:', user.id);

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
            category: itemDetails.category || null,
            family_member_id: itemDetails.family_member_id || null,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (itemError) {
        console.error('[useUpdateInventoryItem] Error updating item:', itemError);
        throw new Error(`Kunne ikke oppdatere gjenstand: ${itemError.message}`);
      }

      console.log('[useUpdateInventoryItem] Item updated successfully');

      // 2. Handle image update if a new image is provided
      if (image) {
        console.log('[useUpdateInventoryItem] Updating image');
        
        // First, find old images to delete them
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
            // Delete old images from storage
            const { error: removeError } = await supabase.storage
              .from('inventory_images')
              .remove(oldImagePaths);

            if (removeError) {
              console.error('[useUpdateInventoryItem] Failed to remove old images from storage:', removeError);
            }

            // Also delete from item_images table
            const { error: dbDeleteError } = await supabase
                .from('item_images')
                .delete()
                .eq('item_id', id)
                .eq('user_id', user.id);
            
            if (dbDeleteError) {
              console.error('[useUpdateInventoryItem] Failed to delete old image records from db:', dbDeleteError);
            }
        }

        // Upload new image
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('inventory_images')
          .upload(fileName, image);

        if (uploadError) {
          console.error('[useUpdateInventoryItem] Error uploading new image:', uploadError);
          throw new Error(`Kunne ikke laste opp nytt bilde: ${uploadError.message}`);
        }

        // Get public URL and link image to item
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

export const useBulkAddInventoryItems = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewInventoryItemData[]>({
    mutationFn: async (newItems) => {
      if (!user) {
        console.error('[useBulkAddInventoryItems] No authenticated user');
        throw new Error("Bruker ikke autentisert");
      }

      console.log('[useBulkAddInventoryItems] Adding', newItems.length, 'items for user:', user.id);

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
          category: item.category || 'Annet',
          family_member_id: item.family_member_id || null,
          user_id: user.id,
        }));

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
