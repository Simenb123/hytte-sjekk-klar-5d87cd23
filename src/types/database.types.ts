// Database types
export interface DbArea {
  id: string;
  name: string;
  created_at: string;
}

export interface DbChecklistItem {
  id: string;
  text: string;
  area_id: string | null;
  category: string | null;
  season: string | null;
  assigned_to: string | null;
  created_at: string;
  app_name?: string | null;
  app_url_ios?: string | null;
  app_url_android?: string | null;
  app_icon_url?: string | null;
  app_description?: string | null;
  checklist_item_images?: { image_url: string }[];
}

export interface DbCompletionLog {
  id: string;
  user_id: string;
  item_id: string;
  is_completed: boolean;
  completed_at: string;
  booking_id: string | null;
}

export interface ChecklistItemWithStatus extends DbChecklistItem {
  isCompleted: boolean;
  imageUrl?: string;
  completedBy?: string;
}

export interface AreaWithItems extends DbArea {
  items: ChecklistItemWithStatus[];
  isCompleted: boolean;
}

export interface DbHyttebokEntry {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export interface CompletionLogWithDetails extends DbCompletionLog {
  checklist_items?: {
    text: string;
    areas?: {
      name: string;
    };
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface DbBookingChecklistCompletion {
  id: string;
  booking_id: string;
  user_id: string;
  category: string;
  completed_at: string;
  completion_data: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}