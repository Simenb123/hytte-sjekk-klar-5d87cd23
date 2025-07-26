import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types/inventory';

export const fetchInventory = async (userId?: string): Promise<InventoryItem[]> => {
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
        primary_location,
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
