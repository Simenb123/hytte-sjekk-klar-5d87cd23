
export type PrimaryLocation = 'hjemme' | 'hytta' | 'reiser';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
  family_member_id: string | null;
  item_images: { image_url: string }[];
  profiles: { first_name: string | null, last_name: string | null, id: string } | null;
  brand: string | null;
  color: string | null;
  location: string | null;
  shelf: string | null;
  size: string | null;
  owner: string | null;
  notes: string | null;
  category: string | null;
  subcategory: string | null;
  primary_location: PrimaryLocation;
  family_members?: { id: string; name: string; nickname: string | null } | null;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}
