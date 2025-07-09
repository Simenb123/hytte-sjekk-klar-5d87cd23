export interface DbArea {
  id: string;
  name: string;
  created_at: string;
}

export interface DbChecklistItem {
  id: string;
  text: string;
  area_id: string | null;
  created_at: string;
  category: string | null;
  season: string | null;
}

export interface DbCompletionLog {
  id: string;
  user_id: string;
  item_id: string;
  completed_at: string;
  is_completed: boolean;
}

export interface DbHyttebokEntry {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface ChecklistItemWithStatus extends DbChecklistItem {
  isCompleted: boolean;
}

export interface AreaWithItems {
  id: string;
  name: string;
  items: ChecklistItemWithStatus[];
  isCompleted: boolean;
}

export interface CompletionLogWithDetails {
  id: string;
  item_id: string;
  user_id: string;
  completed_at: string;
  is_completed: boolean;
  checklist_items?: {
    id: string;
    text: string;
    category: string | null;
    season: string | null;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}
