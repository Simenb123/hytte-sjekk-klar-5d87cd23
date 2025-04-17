
import { supabase } from "@/integrations/supabase/client";
import { CompletionLogWithDetails } from "@/types/database.types";
import { useQuery } from "@tanstack/react-query";

export const useCompletionLogs = () => {
  return useQuery<CompletionLogWithDetails[]>({
    queryKey: ['completionLogs'],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
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

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }

      return logs || [];
    }
  });
};
