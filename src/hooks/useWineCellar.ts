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

  const searchVinmonopoletMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      console.log('🔍 useWineCellar: Calling wine-search edge function with:', searchTerm);
      
      const { data, error } = await supabase.functions.invoke('wine-search', {
        body: { searchTerm, limit: 20 }
      });

      console.log('📦 Response from edge function:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('❌ API error in response:', data.error);
        throw new Error(data.error);
      }

      const products = data?.products || [];
      console.log('✅ Successfully fetched', products.length, 'products');
      
      return products as VinmonopolProduct[];
    },
    onError: (error: any) => {
      console.error('❌ Search mutation error:', error);
      const errorMessage = error?.message || 'Kunne ikke søke i Vinmonopolet. Prøv igjen.';
      toast({ 
        title: 'Feil ved søk', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    },
  });

  return {
    wines,
    isLoading,
    error,
    addWine: addWineMutation.mutate,
    updateWine: updateWineMutation.mutate,
    deleteWine: deleteWineMutation.mutate,
    searchVinmonopolet: searchVinmonopoletMutation.mutateAsync,
    isSearching: searchVinmonopoletMutation.isPending,
    isAdding: addWineMutation.isPending,
    isUpdating: updateWineMutation.isPending,
    isDeleting: deleteWineMutation.isPending,
  };
}