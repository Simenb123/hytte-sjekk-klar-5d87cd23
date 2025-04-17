
import { supabase } from "@/integrations/supabase/client";
import { CompletionLogWithDetails } from "@/types/database.types";
import { useQuery } from "@tanstack/react-query";

export const useCompletionLogs = () => {
  return useQuery<CompletionLogWithDetails[]>({
    queryKey: ['completionLogs'],
    queryFn: async () => {
      console.log('Henter fullføringslogger...');
      const { data: logs, error: logsError } = await supabase
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

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        throw logsError;
      }

      console.log('Fullføringslogger hentet:', logs);
      
      if (!logs || logs.length === 0) {
        console.log('Ingen logger funnet i databasen');
      }

      // Manually map the results to ensure they match the expected type
      const typedResults: CompletionLogWithDetails[] = logs?.map(log => ({
        id: log.id,
        item_id: log.item_id,
        user_id: log.user_id,
        completed_at: log.completed_at,
        is_completed: log.is_completed,
        checklist_items: log.checklist_items,
        profiles: null // Set to null since we're no longer fetching profiles
      })) || [];

      return typedResults;
    },
    staleTime: 1000 * 60 * 2 // 2 minutes
  });
};
