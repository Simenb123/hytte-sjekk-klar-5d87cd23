
import { supabase } from "@/integrations/supabase/client";
import { CompletionLogWithDetails } from "@/types/database.types";

export const fetchCompletionLogs = async (): Promise<CompletionLogWithDetails[]> => {
  const { data, error } = await supabase
    .from('completion_logs')
    .select(`
      id,
      item_id,
      user_id,
      completed_at,
      is_completed,
      checklist_items (
        id,
        text,
        type
      ),
      profiles (
        first_name,
        last_name
      )
    `)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[fetchCompletionLogs] Error:', error);
    throw error;
  }

  return data || [];
};
