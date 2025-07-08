
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FamilyMember, NewFamilyMemberData, UpdateFamilyMemberData } from '@/types/family';
import { useAuth } from '@/state/auth';

const fetchFamilyMembers = async (userId?: string): Promise<FamilyMember[]> => {
  console.log('[useFamilyMembers] Fetching family members for user:', userId);
  
  if (!userId) {
    console.log('[useFamilyMembers] No user ID provided, returning empty array');
    return [];
  }

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useFamilyMembers] Error fetching family members:', error);
    throw new Error(`Kunne ikke hente familiemedlemmer: ${error.message}`);
  }

  console.log('[useFamilyMembers] Successfully fetched', data?.length || 0, 'family members');
  return data as FamilyMember[];
};

export const useFamilyMembers = () => {
  const { user, session } = useAuth();
  
  console.log('[useFamilyMembers] Hook called with user:', user?.id, 'session exists:', !!session);

  return useQuery({
    queryKey: ['family_members', user?.id],
    queryFn: () => fetchFamilyMembers(user?.id),
    enabled: !!user?.id && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useAddFamilyMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, NewFamilyMemberData>({
    mutationFn: async (newMember) => {
      if (!user) {
        console.error('[useAddFamilyMember] No authenticated user');
        throw new Error("Bruker ikke autentisert");
      }

      console.log('[useAddFamilyMember] Adding family member for user:', user.id);

      const { error } = await supabase
        .from('family_members')
        .insert({ 
          ...newMember,
          user_id: user.id,
        });

      if (error) {
        console.error('[useAddFamilyMember] Error inserting family member:', error);
        throw new Error(`Kunne ikke legge til familiemedlem: ${error.message}`);
      }

      console.log('[useAddFamilyMember] Family member added successfully');
    },
    onSuccess: () => {
      console.log('[useAddFamilyMember] Invalidating family members queries');
      queryClient.invalidateQueries({ queryKey: ['family_members'] });
    },
    onError: (error) => {
      console.error('[useAddFamilyMember] Mutation error:', error);
    }
  });
};

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, UpdateFamilyMemberData>({
    mutationFn: async (memberToUpdate) => {
      if (!user) {
        console.error('[useUpdateFamilyMember] No authenticated user');
        throw new Error("Bruker ikke autentisert");
      }

      console.log('[useUpdateFamilyMember] Updating family member:', memberToUpdate.id);

      const { id, ...updateData } = memberToUpdate;

      const { error } = await supabase
        .from('family_members')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useUpdateFamilyMember] Error updating family member:', error);
        throw new Error(`Kunne ikke oppdatere familiemedlem: ${error.message}`);
      }

      console.log('[useUpdateFamilyMember] Family member updated successfully');
    },
    onSuccess: () => {
      console.log('[useUpdateFamilyMember] Invalidating family members queries');
      queryClient.invalidateQueries({ queryKey: ['family_members'] });
    },
    onError: (error) => {
      console.error('[useUpdateFamilyMember] Mutation error:', error);
    }
  });
};

export const useDeleteFamilyMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: async (memberId) => {
      if (!user) {
        console.error('[useDeleteFamilyMember] No authenticated user');
        throw new Error("Bruker ikke autentisert");
      }

      console.log('[useDeleteFamilyMember] Deleting family member:', memberId);

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useDeleteFamilyMember] Error deleting family member:', error);
        throw new Error(`Kunne ikke slette familiemedlem: ${error.message}`);
      }

      console.log('[useDeleteFamilyMember] Family member deleted successfully');
    },
    onSuccess: () => {
      console.log('[useDeleteFamilyMember] Invalidating family members queries');
      queryClient.invalidateQueries({ queryKey: ['family_members'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('[useDeleteFamilyMember] Mutation error:', error);
    }
  });
};
