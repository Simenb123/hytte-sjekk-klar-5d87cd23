
import { supabase } from "@/integrations/supabase/client";
import { DbArea, DbChecklistItem, DbCompletionLog, ChecklistItemWithStatus, AreaWithItems } from "@/types/database.types";
import { toast } from "sonner";

// Fetch all areas from the database
export const fetchAreas = async (): Promise<DbArea[]> => {
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .order('name');

  if (error) {
    console.error('[fetchAreas] Error fetching areas:', error);
    throw error;
  }

  return data || [];
};

// Fetch all checklist items from the database
export const fetchChecklistItems = async (type: 'arrival' | 'departure'): Promise<DbChecklistItem[]> => {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('type', type)
    .order('created_at');

  if (error) {
    console.error(`[fetchChecklistItems] Error fetching ${type} items:`, error);
    throw error;
  }

  return data as DbChecklistItem[] || [];
};

// Fetch completion logs for a user
export const fetchCompletionLogs = async (userId: string): Promise<DbCompletionLog[]> => {
  const { data, error } = await supabase
    .from('completion_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[fetchCompletionLogs] Error fetching completion logs:', error);
    throw error;
  }

  return data || [];
};

// Log completion of a checklist item
export const logItemCompletion = async (
  userId: string, 
  itemId: string, 
  isCompleted: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('completion_logs')
      .insert({
        user_id: userId,
        item_id: itemId,
        is_completed: isCompleted
      });

    if (error) {
      console.error('[logItemCompletion] Error logging item completion:', error);
      toast.error('Kunne ikke registrere fullføringen. Prøv igjen.');
      throw error;
    }
  } catch (error) {
    console.error('[logItemCompletion] Exception:', error);
    toast.error('Kunne ikke registrere fullføringen. Prøv igjen.');
    throw error;
  }
};

// Get arrival items with completion status
export const getArrivalItemsWithStatus = async (userId: string): Promise<ChecklistItemWithStatus[]> => {
  try {
    console.log('[getArrivalItemsWithStatus] Fetching for user:', userId);
    
    // Fetch all arrival checklist items
    const items = await fetchChecklistItems('arrival');
    
    // Fetch all completion logs for the user
    const logs = await fetchCompletionLogs(userId);
    
    console.log('[getArrivalItemsWithStatus] Items:', items.length, 'Logs:', logs.length);
    
    // Create a map of item IDs to their completed status
    const completionMap = new Map<string, boolean>();
    logs.forEach(log => {
      completionMap.set(log.item_id, log.is_completed);
    });
    
    // Map items to include their completion status
    return items.map(item => ({
      ...item,
      isCompleted: completionMap.has(item.id) ? completionMap.get(item.id)! : false
    }));
  } catch (error) {
    console.error('[getArrivalItemsWithStatus] Error:', error);
    throw error;
  }
};

// Get departure areas with items and completion status
export const getDepartureAreasWithItems = async (userId: string): Promise<AreaWithItems[]> => {
  try {
    console.log('[getDepartureAreasWithItems] Fetching for user:', userId);
    
    // Fetch all areas
    const areas = await fetchAreas();
    
    // Fetch all departure checklist items
    const items = await fetchChecklistItems('departure');
    
    // Fetch all completion logs for the user
    const logs = await fetchCompletionLogs(userId);
    
    console.log('[getDepartureAreasWithItems] Areas:', areas.length, 'Items:', items.length, 'Logs:', logs.length);
    
    // Create a map of item IDs to their completed status
    const completionMap = new Map<string, boolean>();
    logs.forEach(log => {
      completionMap.set(log.item_id, log.is_completed);
    });
    
    // Group items by area
    const itemsByArea = items.reduce((acc, item) => {
      const areaId = item.area_id || 'undefined';
      if (!acc[areaId]) {
        acc[areaId] = [];
      }
      
      acc[areaId].push({
        ...item,
        isCompleted: completionMap.has(item.id) ? completionMap.get(item.id)! : false
      });
      
      return acc;
    }, {} as Record<string, ChecklistItemWithStatus[]>);
    
    // Map areas to include their items and completion status
    return areas.map(area => {
      const areaItems = itemsByArea[area.id] || [];
      return {
        ...area,
        items: areaItems,
        isCompleted: areaItems.length > 0 && areaItems.every(item => item.isCompleted)
      };
    });
  } catch (error) {
    console.error('[getDepartureAreasWithItems] Error:', error);
    throw error;
  }
};
