
import { supabase } from "@/integrations/supabase/client";
import { CompletionLogWithDetails } from "@/types/database.types";
import { useQuery } from "@tanstack/react-query";

export const useCompletionLogs = () => {
  return useQuery<CompletionLogWithDetails[]>({
    queryKey: ['completionLogs'],
    queryFn: async () => {
      console.log('Fetching completion logs...');
      
      const { data: logs, error } = await supabase
        .from('completion_logs')
        .select(`
          id,
          item_id,
          user_id,
          completed_at,
          is_completed,
          checklist_items:item_id(id, text, type)
        `)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }

      console.log('Logs fetched:', logs);
      return logs || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
