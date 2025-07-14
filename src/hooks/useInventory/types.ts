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

export const mapItemToRecord = (
  item: Partial<NewInventoryItemData>,
  userId: string,
  defaultCategory: string | null = 'Annet'
) => ({
  name: item.name || '',
  description: item.description || null,
  brand: item.brand || null,
  color: item.color || null,
  location: item.location || null,
  shelf: item.shelf || null,
  size: item.size || null,
  owner: item.owner || null,
  notes: item.notes || null,
  category: item.category ?? defaultCategory,
  family_member_id: item.family_member_id || null,
  user_id: userId
});
