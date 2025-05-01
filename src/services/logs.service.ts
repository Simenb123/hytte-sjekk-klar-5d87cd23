
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
        return logs as CompletionLogWithDetails[];
      } catch (err) {
        console.error('Unexpected error in useCompletionLogs:', err);
        throw err;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
};
