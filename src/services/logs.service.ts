
import { supabase } from "@/integrations/supabase/client";
import { CompletionLogWithDetails } from "@/types/database.types";
import { toast } from "sonner";

export const fetchCompletionLogs = async (): Promise<CompletionLogWithDetails[]> => {
  try {
    // First fetch the logs
    const { data: logs, error: logsError } = await supabase
      .from('completion_logs')
      .select(`
        id,
        item_id,
        user_id,
        completed_at,
        is_completed
      `)
      .order('completed_at', { ascending: false });

    if (logsError) {
      console.error('[fetchCompletionLogs] Error:', logsError);
      throw logsError;
    }

    // For each log, fetch the related checklist item and profile data
    const logsWithDetails = await Promise.all(logs.map(async (log) => {
      // Fetch checklist item details
      const { data: itemData, error: itemError } = await supabase
        .from('checklist_items')
        .select('id, text, type')
        .eq('id', log.item_id)
        .single();

      if (itemError && itemError.code !== 'PGRST116') {
        console.error('[fetchChecklistItem] Error:', itemError);
      }

      // Fetch user profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', log.user_id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[fetchUserProfile] Error:', profileError);
      }

      return {
        ...log,
        checklist_items: itemData || null,
        profiles: profileData || null
      };
    }));

    return logsWithDetails;
  } catch (error) {
    console.error('Error fetching logs:', error);
    toast.error('Failed to load completion logs');
    return [];
  }
};
