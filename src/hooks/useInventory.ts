
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
      item_images ( image_url ),
      profiles ( id, first_name, last_name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw new Error(error.message);
  }

  // The join with profiles on user_id might return an array, but it should be a single profile.
  // We'll map to ensure `profiles` is an object, not an array.
  return data.map(item => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  })) as InventoryItem[];
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
