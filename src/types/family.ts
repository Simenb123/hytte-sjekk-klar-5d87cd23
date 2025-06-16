
export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  nickname: string | null;
  birth_date: string | null;
  role: 'parent' | 'child' | 'other' | null;
  is_user: boolean;
  linked_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewFamilyMemberData {
  name: string;
  nickname?: string;
  birth_date?: string;
  role?: 'parent' | 'child' | 'other';
  is_user?: boolean;
  linked_user_id?: string;
}

export interface UpdateFamilyMemberData extends NewFamilyMemberData {
  id: string;
}

export interface TaskAssignment {
  id: string;
  checklist_item_id: string;
  family_member_id: string;
  assigned_by_user_id: string;
  assigned_at: string;
  completed_at: string | null;
  is_completed: boolean;
  notes: string | null;
}
