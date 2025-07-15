export interface WineCellarItem {
  id: string;
  user_id: string;
  name: string;
  vintage?: string;
  producer?: string;
  grape_variety?: string;
  wine_color?: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified';
  alcohol_percentage?: number;
  bottle_count: number;
  location: string;
  purchase_price?: number;
  current_price?: number;
  purchase_info?: string;
  purchase_date?: string;
  consumed_date?: string;
  is_consumed: boolean;
  rating?: number;
  tasting_notes?: string;
  serving_notes?: string;
  consumed_with?: string;
  vinmonopol_id?: string;
  vinmonopol_url?: string;
  image_url?: string;
  description?: string;
  country?: string;
  region?: string;
  created_at: string;
  updated_at: string;
}

export interface VinmonopolProduct {
  vinmonopol_id: string;
  name: string;
  vinmonopol_url?: string;
  current_price?: number;
  image_url?: string;
  description?: string;
  producer?: string;
  country?: string;
  region?: string;
  vintage?: string;
  alcohol_percentage?: number;
  wine_color?: string;
  grape_variety?: string;
  tasting_notes?: string;
}

export interface WineFilters {
  search: string;
  location: string;
  wine_color: string;
  rating: string;
  is_consumed: string;
  sort_by: 'name' | 'created_at' | 'rating' | 'purchase_date' | 'current_price';
  sort_direction: 'asc' | 'desc';
}