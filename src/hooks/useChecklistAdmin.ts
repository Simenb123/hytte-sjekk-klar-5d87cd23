
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/state/toast';
import type { TablesUpdate } from '@/integrations/supabase/types';

export function useChecklistAdmin() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateChecklistItem = async (
    itemId: string,
    updates: TablesUpdate<'checklist_items'>
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Oppgave oppdatert",
        description: "Endringene er lagret.",
      });
    } catch (error: unknown) {
      console.error('Error updating checklist item:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere oppgaven.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Oppgave slettet",
        description: "Oppgaven er fjernet fra sjekklisten.",
      });
    } catch (error: unknown) {
      console.error('Error deleting checklist item:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette oppgaven.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateArea = async (
    areaId: string,
    updates: TablesUpdate<'areas'>
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('areas')
        .update(updates)
        .eq('id', areaId);

      if (error) throw error;

      toast({
        title: "Område oppdatert",
        description: "Endringene er lagret.",
      });
    } catch (error: unknown) {
      console.error('Error updating area:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere området.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (areaId: string) => {
    setLoading(true);
    try {
      // First check if area has checklist items
      const { data: items } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('area_id', areaId);

      if (items && items.length > 0) {
        throw new Error('Kan ikke slette område som inneholder oppgaver');
      }

      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;

      toast({
        title: "Område slettet",
        description: "Området er fjernet.",
      });
    } catch (error: unknown) {
      console.error('Error deleting area:', error);
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Kunne ikke slette området.';
      toast({
        title: "Feil",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reorderChecklistItems = async (
    category: string,
    reorderedItems: Array<{ id: string; sort_order: number }>
  ) => {
    setLoading(true);
    try {
      // Update all items with their new sort order
      const updates = reorderedItems.map(item => 
        supabase
          .from('checklist_items')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      toast({
        title: "Rekkefølge oppdatert",
        description: "Sorteringen er lagret.",
      });
    } catch (error: unknown) {
      console.error('Error reordering checklist items:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere rekkefølgen.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetToLogicalOrder = async (category: string) => {
    setLoading(true);
    try {
      // Fetch all items for the category
      const { data: items, error } = await supabase
        .from('checklist_items')
        .select('id, text')
        .eq('category', category);

      if (error) throw error;

      if (!items || items.length === 0) {
        toast({
          title: "Ingen oppgaver",
          description: "Ingen oppgaver funnet for denne kategorien.",
        });
        return;
      }

      // Apply logical sorting based on category and text content
      const sortedItems = items
        .map((item, index) => ({
          id: item.id,
          sort_order: (index + 1) * 10 // Give space for future insertions
        }));

      await reorderChecklistItems(category, sortedItems);
    } catch (error: unknown) {
      console.error('Error resetting to logical order:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke tilbakestille rekkefølgen.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateChecklistItem,
    deleteChecklistItem,
    updateArea,
    deleteArea,
    reorderChecklistItems,
    resetToLogicalOrder,
    loading
  };
}
