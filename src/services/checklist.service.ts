import { supabase } from "@/integrations/supabase/client";
import { DbArea, DbChecklistItem, DbCompletionLog, ChecklistItemWithStatus, AreaWithItems } from "@/types/database.types";
import { toast } from "sonner";
import { ChecklistCategory, checklistCategories } from "@/models/checklist";

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

// This function now fetches items by category and optionally filters by season.
export const fetchChecklistItems = async (category: string, season?: 'winter' | 'summer' | 'all'): Promise<DbChecklistItem[]> => {
  let query = supabase
    .from('checklist_items')
    .select(`*, checklist_item_images ( image_url )`)
    .eq('category', category);

  if (season && season !== 'all') {
    // Fetches items for the specific season OR items for 'all' seasons.
    query = query.in('season', [season, 'all']);
  }
  
  const { data, error } = await query.order('created_at');

  if (error) {
    console.error(`[fetchChecklistItems] Error fetching ${category} items:`, error);
    throw error;
  }

  return data as DbChecklistItem[] || [];
};

// Fetch completion logs for a user, ordered to get the latest status first.
export const fetchCompletionLogs = async (userId: string, bookingId?: string): Promise<DbCompletionLog[]> => {
  let query = supabase
    .from('completion_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  const { data, error } = await query;

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
  isCompleted: boolean,
  bookingId?: string
) => {
  console.log(`[checklist.service] Logging completion - userId: ${userId}, itemId: ${itemId}, isCompleted: ${isCompleted}`);
  
  try {
    // We upsert to ensure we only have one log entry that matters per user per item, storing the latest state.
    // Or we just insert and find the latest. Let's stick with insert, it's simpler.
    const { data, error } = await supabase
      .from('completion_logs')
      .insert([
        {
          user_id: userId,
          item_id: itemId,
          is_completed: isCompleted,
          booking_id: bookingId,
        }
      ]);
      
    if (error) {
      console.error('[checklist.service] Error logging completion:', error);
      throw error;
    }
    
    console.log('[checklist.service] Successfully logged completion:', data);
    return data;
  } catch (error) {
    console.error('[checklist.service] Exception logging completion:', error);
    throw error;
  }
};

// This function is a replacement for getArrivalItemsWithStatus and getDepartureAreasWithItems.
export const getChecklistForCategory = async (
  userId: string,
  category: string,
  bookingId?: string
): Promise<AreaWithItems[]> => {
  try {
    console.log(`[getChecklistForCategory] Fetching for user: ${userId}, category: ${category}`);

    // Determine season
    const month = new Date().getMonth(); // 0-11
    const season = (month >= 9 || month <= 2) ? 'winter' : 'summer'; // Oct-Mar is winter

    // Fetch all areas and items for the category, filtered by season
    const areas = await fetchAreas();
    const items = await fetchChecklistItems(category, season);
    const logs = await fetchCompletionLogs(userId, bookingId);

    console.log(`[getChecklistForCategory] Areas: ${areas.length}, Items: ${items.length}, Logs: ${logs.length}, Season: ${season}`);

    // Create a map of item IDs to their latest completed status
    const completionMap = new Map<string, boolean>();
    logs.forEach(log => {
      // Since logs are ordered by date descending, the first one we see is the latest.
      if (!completionMap.has(log.item_id)) {
        completionMap.set(log.item_id, log.is_completed);
      }
    });

    // Group items by area
    const itemsByArea = items.reduce((acc, item) => {
      const areaId = item.area_id;
      if (!areaId) return acc;
      if (!acc[areaId]) {
        acc[areaId] = [];
      }
      acc[areaId].push({
        ...item,
        isCompleted: completionMap.get(item.id) ?? false,
        imageUrl: item.checklist_item_images?.[0]?.image_url
      });
      return acc;
    }, {} as Record<string, ChecklistItemWithStatus[]>);

    // Map areas to include their items and completion status
    const result = areas.map(area => {
      const areaItems = itemsByArea[area.id] || [];
      return {
        ...area,
        name: area.name,
        items: areaItems,
        isCompleted: areaItems.length > 0 && areaItems.every(item => item.isCompleted)
      };
    }).filter(area => area.items.length > 0); // Only return areas that have items for this category

    return result;

  } catch (error) {
    console.error('[getChecklistForCategory] Error:', error);
    throw error;
  }
};

// New function to fetch all checklist items for a given season
export const fetchAllChecklistItemsForSeason = async (season: 'winter' | 'summer'): Promise<DbChecklistItem[]> => {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .in('season', [season, 'all']);

  if (error) {
    console.error(`[fetchAllChecklistItemsForSeason] Error fetching items for season ${season}:`, error);
    throw error;
  }
  return data || [];
};

// New type for category summary
export type CategorySummary = {
  totalItems: number;
  completedItems: number;
  progress: number;
};

// New function to get summary for all categories
export const getCategoriesSummary = async (
  userId: string,
  bookingId?: string
): Promise<Record<string, CategorySummary>> => {
  try {
    const month = new Date().getMonth();
    const season = (month >= 9 || month <= 2) ? 'winter' : 'summer';

    const [allItems, logs] = await Promise.all([
      fetchAllChecklistItemsForSeason(season),
      fetchCompletionLogs(userId, bookingId)
    ]);

    const completionMap = new Map<string, boolean>();
    logs.forEach(log => {
      if (!completionMap.has(log.item_id)) {
        completionMap.set(log.item_id, log.is_completed);
      }
    });
    
    const summary: Record<string, { totalItems: number, completedItems: number }> = {};
    Object.keys(checklistCategories).forEach(key => {
        summary[key] = { totalItems: 0, completedItems: 0 };
    });

    allItems.forEach(item => {
      if (item.category && summary[item.category]) {
        summary[item.category].totalItems++;
        if (completionMap.get(item.id) === true) {
          summary[item.category].completedItems++;
        }
      }
    });
    
    const result: Record<string, CategorySummary> = {};
    for (const categoryKey in summary) {
      const { totalItems, completedItems } = summary[categoryKey];
      result[categoryKey] = {
        totalItems,
        completedItems,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      };
    }
    
    return result;
  } catch (error) {
    console.error('[getCategoriesSummary] Error:', error);
    throw error;
  }
};
