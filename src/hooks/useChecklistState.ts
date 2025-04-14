
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ChecklistItem, ChecklistArea, ChecklistType, initialArrivals, initialDepartureAreas } from '../models/checklist';
import { loadFromStorage, saveToStorage } from '../utils/storage.utils';

export const useChecklistState = () => {
  const [arrivals, setArrivals] = useState<ChecklistItem[]>(() => 
    loadFromStorage('hytteArrivals', initialArrivals)
  );
  
  const [departureAreas, setDepartureAreas] = useState<ChecklistArea[]>(() => 
    loadFromStorage('hytteDepartures', initialDepartureAreas)
  );
  
  const [currentView, setCurrentViewState] = useState<ChecklistType | null>(() => 
    loadFromStorage('hytteCurrentView', null)
  );
  
  const [selectedArea, setSelectedAreaState] = useState<ChecklistArea | null>(() => {
    try {
      const savedAreaId = localStorage.getItem('hytteSelectedAreaId');
      if (!savedAreaId) return null;
      
      const areas = loadFromStorage('hytteDepartures', initialDepartureAreas);
      return areas.find(area => area.id === savedAreaId) || null;
    } catch (error) {
      console.error('Error loading selected area from localStorage', error);
      return null;
    }
  });

  const setCurrentView = useCallback((view: ChecklistType | null) => {
    console.log('[ChecklistContext] Setting current view to:', view);
    setCurrentViewState(view);
    saveToStorage('hytteCurrentView', view);
  }, []);

  const selectArea = useCallback((area: ChecklistArea | null) => {
    console.log('[ChecklistContext] Selecting area:', area?.id);
    setSelectedAreaState(area);
    saveToStorage('hytteSelectedAreaId', area?.id || null);
  }, []);

  const toggleArrivalItem = useCallback((id: string) => {
    console.log('[ChecklistContext] Toggling arrival item:', id);
    setArrivals((prevItems) => {
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      
      saveToStorage('hytteArrivals', newItems);
      
      const allCompleted = newItems.every(item => item.isCompleted);
      if (allCompleted) {
        toast("Velkommen til hytta! Kos deg på turen 😊", {
          position: "top-center",
        });
      }
      
      return newItems;
    });
  }, []);

  const toggleDepartureItem = useCallback((areaId: string, itemId: string) => {
    console.log('[ChecklistContext] Toggling departure item:', { areaId, itemId });
    setDepartureAreas((prevAreas) => {
      const newAreas = prevAreas.map((area) => {
        if (area.id !== areaId) return area;
        
        const newItems = area.items.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        
        const isAreaCompleted = newItems.every((item) => item.isCompleted);
        
        return {
          ...area,
          items: newItems,
          isCompleted: isAreaCompleted,
        };
      });
      
      saveToStorage('hytteDepartures', newAreas);
      
      const allAreasCompleted = newAreas.every(area => area.isCompleted);
      if (allAreasCompleted) {
        toast("God tur hjem! Hytta er nå sikret 🏠", {
          position: "top-center",
        });
      }
      
      return newAreas;
    });
  }, []);

  const resetChecklists = useCallback(() => {
    console.log('[ChecklistContext] Resetting all checklists');
    setArrivals(initialArrivals);
    setDepartureAreas(initialDepartureAreas);
    setCurrentViewState(null);
    setSelectedAreaState(null);
    
    try {
      localStorage.removeItem('hytteArrivals');
      localStorage.removeItem('hytteDepartures');
      localStorage.removeItem('hytteCurrentView');
      localStorage.removeItem('hytteSelectedAreaId');
    } catch (error) {
      console.error('Error removing items from localStorage', error);
    }
  }, []);

  const isAllArrivalsCompleted = useCallback(() => {
    return arrivals.every((item) => item.isCompleted);
  }, [arrivals]);

  const isAllDeparturesCompleted = useCallback(() => {
    return departureAreas.every((area) => area.isCompleted);
  }, [departureAreas]);

  return {
    arrivals,
    departureAreas,
    currentView,
    selectedArea,
    setCurrentView,
    selectArea,
    toggleArrivalItem,
    toggleDepartureItem,
    resetChecklists,
    isAllArrivalsCompleted,
    isAllDeparturesCompleted,
  };
};
