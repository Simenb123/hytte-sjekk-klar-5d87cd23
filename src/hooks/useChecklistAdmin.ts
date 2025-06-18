
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useChecklistAdmin() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateChecklistItem = async (itemId: string, updates: any) => {
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  const updateArea = async (areaId: string, updates: any) => {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error deleting area:', error);
      toast({
        title: "Feil",
        description: error.message || "Kunne ikke slette området.",
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
    loading
  };
}
