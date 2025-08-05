import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeBookingChecklistCategory,
  getBookingChecklistStatus,
  getBookingChecklistHistory,
  deleteBookingChecklistCompletion,
  type CategoryCompletionData,
  type BookingChecklistCompletion
} from '@/services/bookingChecklist.service';
import type { ChecklistCategory } from '@/models/checklist';

export function useBookingChecklistStatus(bookingId: string | null) {
  return useQuery({
    queryKey: ['booking-checklist-status', bookingId],
    queryFn: () => bookingId ? getBookingChecklistStatus(bookingId) : Promise.resolve({}),
    enabled: !!bookingId,
  });
}

export function useBookingChecklistHistory(bookingId: string | null) {
  return useQuery({
    queryKey: ['booking-checklist-history', bookingId],
    queryFn: () => bookingId ? getBookingChecklistHistory(bookingId) : Promise.resolve([]),
    enabled: !!bookingId,
  });
}

export function useBookingChecklistActions() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const completeCategoryForBooking = useCallback(
    async (
      bookingId: string,
      category: ChecklistCategory,
      completionData: CategoryCompletionData,
      notes?: string
    ): Promise<boolean> => {
      setLoading(true);
      try {
        const success = await completeBookingChecklistCategory(
          bookingId,
          category,
          completionData,
          notes
        );

        if (success) {
          // Invalidate related queries
          queryClient.invalidateQueries({ 
            queryKey: ['booking-checklist-status', bookingId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['booking-checklist-history', bookingId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['categories-summary'] 
          });
        }

        return success;
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  const deleteCompletion = useCallback(
    async (bookingId: string, category: string): Promise<boolean> => {
      setLoading(true);
      try {
        const success = await deleteBookingChecklistCompletion(bookingId, category);

        if (success) {
          // Invalidate related queries
          queryClient.invalidateQueries({ 
            queryKey: ['booking-checklist-status', bookingId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['booking-checklist-history', bookingId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['categories-summary'] 
          });
        }

        return success;
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  return {
    completeCategoryForBooking,
    deleteCompletion,
    loading,
  };
}

export function useIsCategoryCompletedForBooking(
  bookingId: string | null,
  category: ChecklistCategory
): boolean {
  const { data: statusMap } = useBookingChecklistStatus(bookingId);
  return !!(statusMap && statusMap[category]);
}