import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type { WineCellarItem, VinmonopolProduct } from '@/types/wine';

export function useWineCellar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wines = [], isLoading, error } = useQuery({
    queryKey: ['wine-cellar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('wine_cellar')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WineCellarItem[];
    },
    enabled: !!user?.id,
  });

  const addWineMutation = useMutation({
    mutationFn: async (wine: Partial<WineCellarItem>) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!wine.name) throw new Error('Wine name is required');

      const wineData = { 
        ...wine, 
        user_id: user.id,
        name: wine.name,
        bottle_count: wine.bottle_count || 1,
        location: wine.location || 'Hjemme',
        is_consumed: wine.is_consumed || false
      };

      const { data, error } = await supabase
        .from('wine_cellar')
        .insert(wineData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-cellar'] });
      toast({ title: 'Vin lagt til i vinlageret!' });
    },
    onError: (error) => {
      toast({ title: 'Feil', description: 'Kunne ikke legge til vin', variant: 'destructive' });
      console.error('Error adding wine:', error);
    },
  });

  const updateWineMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WineCellarItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('wine_cellar')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-cellar'] });
      toast({ title: 'Vin oppdatert!' });
    },
    onError: (error) => {
      toast({ title: 'Feil', description: 'Kunne ikke oppdatere vin', variant: 'destructive' });
      console.error('Error updating wine:', error);
    },
  });

  const deleteWineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wine_cellar')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-cellar'] });
      toast({ title: 'Vin slettet fra vinlageret!' });
    },
    onError: (error) => {
      toast({ title: 'Feil', description: 'Kunne ikke slette vin', variant: 'destructive' });
      console.error('Error deleting wine:', error);
    },
  });

  const searchVinmonopolet = async (searchTerm: string): Promise<VinmonopolProduct[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('wine-search', {
        body: { searchTerm, limit: 20 }
      });

      if (error) throw error;
      return data.products || [];
    } catch (error) {
      console.error('Error searching Vinmonopolet:', error);
      toast({ title: 'Feil', description: 'Kunne ikke søke i Vinmonopolet', variant: 'destructive' });
      return [];
    }
  };

  return {
    wines,
    isLoading,
    error,
    addWine: addWineMutation.mutate,
    updateWine: updateWineMutation.mutate,
    deleteWine: deleteWineMutation.mutate,
    searchVinmonopolet,
    isAdding: addWineMutation.isPending,
    isUpdating: updateWineMutation.isPending,
    isDeleting: deleteWineMutation.isPending,
  };
}