
import { useCallback } from 'react';
import { ChecklistItem, ChecklistArea } from '../models/checklist';
import { useAuth } from '../context/AuthContext';
import { logItemCompletion } from '../services/checklist.service';
import { toast } from 'sonner';

export const useChecklistActions = (
  arrivals: ChecklistItem[],
  setArrivals: (items: ChecklistItem[]) => void,
  departureAreas: ChecklistArea[],
  setDepartureAreas: (areas: ChecklistArea[]) => void
) => {
  const { user } = useAuth();

  const toggleArrivalItem = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    
    console.log('[ChecklistActions] Toggling arrival item:', id);
    
    // Create a new array with the updated item
    const updatedItems = arrivals.map((item) =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    
    // Find the item being toggled to get its new completion state
    const itemToToggle = updatedItems.find(item => item.id === id);
    if (itemToToggle) {
      const newIsCompleted = itemToToggle.isCompleted;
      
      // Log the completion status
      logItemCompletion(user.id, id, newIsCompleted)
        .catch(error => {
          console.error('[toggleArrivalItem] Failed to log completion:', error);
        });
    }
    
    // Update the state with the new array
    setArrivals(updatedItems);
  }, [user, setArrivals, arrivals]);

  const toggleDepartureItem = useCallback(async (areaId: string, itemId: string) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    
    console.log('[ChecklistActions] Toggling departure item:', { areaId, itemId });
    
    // Create a new array with the updated area and items
    const updatedAreas = departureAreas.map((area) => {
      if (area.id !== areaId) return area;
      
      // Update items within the specific area
      const updatedItems = area.items.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      );
      
      // Check if all items in this area are completed
      const isAreaCompleted = updatedItems.every((item) => item.isCompleted);
      
      return {
        ...area,
        items: updatedItems,
        isCompleted: isAreaCompleted,
      };
    });
    
    // Find the toggled item to get its new state
    const area = updatedAreas.find(a => a.id === areaId);
    if (area) {
      const itemToToggle = area.items.find(item => item.id === itemId);
      if (itemToToggle) {
        // Log the completion status
        logItemCompletion(user.id, itemId, itemToToggle.isCompleted)
          .catch(error => {
            console.error('[toggleDepartureItem] Failed to log completion:', error);
          });
      }
    }
    
    // Update the state with the new areas array
    setDepartureAreas(updatedAreas);
  }, [user, setDepartureAreas, departureAreas]);

  const isAllArrivalsCompleted = useCallback(() => {
    return arrivals.every((item) => item.isCompleted);
  }, [arrivals]);

  const isAllDeparturesCompleted = useCallback(() => {
    return departureAreas.every((area) => area.isCompleted);
  }, [departureAreas]);

  return {
    toggleArrivalItem,
    toggleDepartureItem,
    isAllArrivalsCompleted,
    isAllDeparturesCompleted,
  };
};
