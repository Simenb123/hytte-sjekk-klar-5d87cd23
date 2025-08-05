import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ChecklistCategory } from '@/models/checklist';

export interface BookingChecklistCompletion {
  id: string;
  booking_id: string;
  user_id: string;
  category: string;
  completed_at: string;
  completion_data: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryCompletionData {
  items: Array<{
    id: string;
    text: string;
    isCompleted: boolean;
    completedBy?: string;
    notes?: string;
  }>;
  totalItems: number;
  completedItems: number;
  completedBy: string;
}

export async function completeBookingChecklistCategory(
  bookingId: string,
  category: ChecklistCategory,
  completionData: CategoryCompletionData,
  notes?: string
): Promise<boolean> {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('booking_checklist_completions')
      .upsert(
        {
          booking_id: bookingId,
          user_id: user.data.user.id,
          category,
          completion_data: completionData as any,
          notes,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'booking_id,category',
        }
      );

    if (error) throw error;

    toast.success(`Sjekkliste "${category}" fullført for booking`);
    return true;
  } catch (error) {
    console.error('Error completing booking checklist category:', error);
    toast.error('Kunne ikke fullføre sjekkliste-kategorien');
    return false;
  }
}

export async function getBookingChecklistStatus(
  bookingId: string
): Promise<Record<string, BookingChecklistCompletion>> {
  try {
    const { data, error } = await supabase
      .from('booking_checklist_completions')
      .select('*')
      .eq('booking_id', bookingId);

    if (error) throw error;

    const statusMap: Record<string, BookingChecklistCompletion> = {};
    data?.forEach((completion) => {
      statusMap[completion.category] = completion;
    });

    return statusMap;
  } catch (error) {
    console.error('Error fetching booking checklist status:', error);
    return {};
  }
}

export async function getBookingChecklistHistory(
  bookingId: string
): Promise<BookingChecklistCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('booking_checklist_completions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching booking checklist history:', error);
    return [];
  }
}

export async function getUserBookingCompletions(
  userId: string
): Promise<BookingChecklistCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('booking_checklist_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user booking completions:', error);
    return [];
  }
}

export async function deleteBookingChecklistCompletion(
  bookingId: string,
  category: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('booking_checklist_completions')
      .delete()
      .eq('booking_id', bookingId)
      .eq('category', category);

    if (error) throw error;

    toast.success('Sjekkliste-fullføring slettet');
    return true;
  } catch (error) {
    console.error('Error deleting booking checklist completion:', error);
    toast.error('Kunne ikke slette sjekkliste-fullføring');
    return false;
  }
}