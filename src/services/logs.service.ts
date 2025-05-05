
import { supabase } from "@/integrations/supabase/client";
import { CompletionLogWithDetails } from "@/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCompletionLogs = () => {
  return useQuery<CompletionLogWithDetails[]>({
    queryKey: ['completionLogs'],
    queryFn: async () => {
      console.log('Fetching completion logs...');
      
      try {
        // First verify auth status
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          console.warn('No authenticated user found while fetching logs');
          toast.error('Du må være logget inn for å se logger');
          return [];
        }
        
        const { data: logs, error } = await supabase
          .from('completion_logs')
          .select(`
            id,
            item_id,
            user_id,
            completed_at,
            is_completed,
            checklist_items:item_id(id, text, type),
            profiles:user_id(first_name, last_name)
          `)
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('Error fetching logs:', error);
          toast.error('Kunne ikke hente logger');
          throw error;
        }

        console.log('Logs fetched successfully:', logs);
        // Use a double cast to avoid type errors
        return (logs || []) as unknown as CompletionLogWithDetails[];
      } catch (err) {
        console.error('Unexpected error in useCompletionLogs:', err);
        throw err;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

// Get the latest completion for a specific item and the current user
export const getLatestCompletion = async (itemId: string): Promise<{ completed_at: string; user_email: string } | null> => {
  try {
    console.log('[getLatestCompletion] Fetching latest completion for item:', itemId);
    
    // First verify auth status
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      console.warn('No authenticated user found while fetching latest completion');
      return null;
    }
    
    const { data, error } = await supabase
      .from('completion_logs')
      .select(`
        completed_at,
        profiles:user_id(email)
      `)
      .eq('item_id', itemId)
      .eq('user_id', session.session.user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getLatestCompletion] Error:', error);
      return null;
    }
    
    console.log('[getLatestCompletion] Found completion:', data);
    
    // If no data found, return null
    if (!data) return null;
    
    // Transform the data structure to match the expected return type
    return {
      completed_at: data.completed_at,
      user_email: data.profiles?.email || 'Unknown user'
    };
  } catch (error) {
    console.error('[getLatestCompletion] Unexpected error:', error);
    return null;
  }
};

// Reset (delete) completion for a specific item and the current user
export const resetCompletion = async (itemId: string): Promise<void> => {
  try {
    console.log('[resetCompletion] Resetting completion for item:', itemId);
    
    // First verify auth status
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      console.warn('No authenticated user found while resetting completion');
      toast.error('Du må være logget inn for å nullstille status');
      return;
    }
    
    const { error } = await supabase
      .from('completion_logs')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', session.session.user.id);

    if (error) {
      console.error('[resetCompletion] Error:', error);
      toast.error('Kunne ikke nullstille status');
      throw error;
    }
    
    console.log('[resetCompletion] Successfully reset completion for item:', itemId);
  } catch (error) {
    console.error('[resetCompletion] Unexpected error:', error);
    throw error;
  }
};
