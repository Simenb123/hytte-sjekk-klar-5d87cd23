
import { supabase } from "@/integrations/supabase/client";

export const fetchCompletionLogs = async () => {
  const { data, error } = await supabase
    .from('completion_logs')
    .select(`
      *,
      checklist_items (
        text,
        type
      ),
      profiles:completion_logs.user_id (
        first_name,
        last_name
      )
    `)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[fetchCompletionLogs] Error:', error);
    throw error;
  }

  return data;
};
