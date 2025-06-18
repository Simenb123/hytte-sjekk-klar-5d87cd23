
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryAIResult {
  name: string;
  description: string;
  category: string;
  brand?: string;
  color?: string;
  size?: string;
  confidence: number;
}

export function useInventoryAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeItemFromImage = async (image: string): Promise<InventoryAIResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('inventory-ai', {
        body: { image },
      });

      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);

      return data.result;
    } catch (err: any) {
      console.error('Error analyzing item:', err);
      setError('Kunne ikke analysere gjenstanden. Prøv igjen.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchSimilarItems = async (description: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: searchError } = await supabase
        .from('inventory_items')
        .select('*')
        .or(`name.ilike.%${description}%,description.ilike.%${description}%,category.ilike.%${description}%`)
        .limit(5);

      if (searchError) throw searchError;
      return data || [];
    } catch (err: any) {
      console.error('Error searching items:', err);
      setError('Kunne ikke søke i inventaret.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeItemFromImage,
    searchSimilarItems,
    loading,
    error
  };
}
