
import { useCallback } from 'react';
import { toast } from 'sonner';
import { ChecklistItem, ChecklistArea } from '../models/checklist';
import { useAuth } from '../context/AuthContext';
import { logItemCompletion } from '../services/checklist.service';

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
    
    setArrivals((prevItems) => {
      const itemToToggle = prevItems.find(item => item.id === id);
      if (!itemToToggle) return prevItems;
      
      const newIsCompleted = !itemToToggle.isCompleted;
      
      logItemCompletion(user.id, id, newIsCompleted)
        .catch(error => {
          console.error('[toggleArrivalItem] Failed to log completion:', error);
        });
      
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, isCompleted: newIsCompleted } : item
      );
      
      const allCompleted = newItems.every(item => item.isCompleted);
      if (allCompleted) {
        toast("Velkommen til hytta! Kos deg på turen 😊", {
          position: "top-center",
        });
      }
      
      return newItems;
    });
  }, [user, setArrivals]);

  const toggleDepartureItem = useCallback(async (areaId: string, itemId: string) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    
    console.log('[ChecklistActions] Toggling departure item:', { areaId, itemId });
    
    setDepartureAreas((prevAreas) => {
      const area = prevAreas.find(a => a.id === areaId);
      if (!area) return prevAreas;
      
      const itemToToggle = area.items.find(item => item.id === itemId);
      if (!itemToToggle) return prevAreas;
      
      const newIsCompleted = !itemToToggle.isCompleted;
      
      logItemCompletion(user.id, itemId, newIsCompleted)
        .catch(error => {
          console.error('[toggleDepartureItem] Failed to log completion:', error);
        });
      
      const newAreas = prevAreas.map((area) => {
        if (area.id !== areaId) return area;
        
        const newItems = area.items.map((item) =>
          item.id === itemId ? { ...item, isCompleted: newIsCompleted } : item
        );
        
        const isAreaCompleted = newItems.every((item) => item.isCompleted);
        
        return {
          ...area,
          items: newItems,
          isCompleted: isAreaCompleted,
        };
      });
      
      const allAreasCompleted = newAreas.every(area => area.isCompleted);
      if (allAreasCompleted) {
        toast("God tur hjem! Hytta er nå sikret 🏠", {
          position: "top-center",
        });
      }
      
      return newAreas;
    });
  }, [user, setDepartureAreas]);

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
