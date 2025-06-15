
export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
  item_images: { image_url: string }[];
  profiles: { first_name: string | null, last_name: string | null, id: string } | null;
  brand: string | null;
  color: string | null;
  location: string | null;
  shelf: string | null;
  size: string | null;
  owner: string | null;
  notes: string | null;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}
