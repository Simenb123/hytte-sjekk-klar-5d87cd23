import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ContactType = 'audio' | 'video' | 'sms';

export interface QuickContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  contact_type: ContactType;
  show_on_main: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch all contacts for the current user
export function useQuickContacts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quick-contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('quick_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as QuickContact[];
    },
    enabled: !!user?.id,
  });
}

// Fetch only contacts that should be shown on main screen
export function useMainScreenContacts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['main-screen-contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('quick_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('show_on_main', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as QuickContact[];
    },
    enabled: !!user?.id,
  });
}

// Add a new contact
export function useAddQuickContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contact: Omit<QuickContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('quick_contacts')
        .insert({
          ...contact,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['main-screen-contacts'] });
      toast.success('Kontakt lagt til');
    },
    onError: (error) => {
      console.error('Error adding contact:', error);
      toast.error('Kunne ikke legge til kontakt');
    },
  });
}

// Update an existing contact
export function useUpdateQuickContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuickContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('quick_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['main-screen-contacts'] });
      toast.success('Kontakt oppdatert');
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
      toast.error('Kunne ikke oppdatere kontakt');
    },
  });
}

// Delete a contact
export function useDeleteQuickContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quick_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['main-screen-contacts'] });
      toast.success('Kontakt slettet');
    },
    onError: (error) => {
      console.error('Error deleting contact:', error);
      toast.error('Kunne ikke slette kontakt');
    },
  });
}
