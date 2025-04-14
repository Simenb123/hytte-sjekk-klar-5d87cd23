import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ChecklistItem, ChecklistArea, ChecklistType, initialArrivals, initialDepartureAreas } from '../models/checklist';
import { loadFromStorage, saveToStorage } from '../utils/storage.utils';

export const useChecklistState = () => {
  const isInitialMount = useRef(true);
  
  const [arrivals, setArrivals] = useState<ChecklistItem[]>(() => {
    try {
      const loaded = loadFromStorage('hytteArrivals', initialArrivals);
      console.log('[useChecklistState] Loaded arrivals:', loaded.length);
      return loaded;
    } catch (error) {
      console.error('[useChecklistState] Failed to load arrivals, using initial data:', error);
      return initialArrivals;
    }
  });
  
  const [departureAreas, setDepartureAreas] = useState<ChecklistArea[]>(() => {
    try {
      const loaded = loadFromStorage('hytteDepartures', initialDepartureAreas);
      console.log('[useChecklistState] Loaded departure areas:', loaded.length);
      return loaded;
    } catch (error) {
      console.error('[useChecklistState] Failed to load departure areas, using initial data:', error);
      return initialDepartureAreas;
    }
  });
  
  const [currentView, setCurrentViewState] = useState<ChecklistType | null>(() => {
    try {
      const view = loadFromStorage('hytteCurrentView', null);
      console.log('[useChecklistState] Loaded current view:', view);
      return view;
    } catch (error) {
      console.error('[useChecklistState] Failed to load current view, using null:', error);
      return null;
    }
  });
  
  const [selectedArea, setSelectedAreaState] = useState<ChecklistArea | null>(() => {
    try {
      const savedAreaId = localStorage.getItem('hytteSelectedAreaId');
      console.log('[useChecklistState] Loaded selected area ID:', savedAreaId);
      
      if (!savedAreaId) return null;
      
      const areas = loadFromStorage('hytteDepartures', initialDepartureAreas);
      const area = areas.find(area => area.id === savedAreaId) || null;
      console.log('[useChecklistState] Found area object:', area?.id);
      return area;
    } catch (error) {
      console.error('[useChecklistState] Error loading selected area from localStorage', error);
      return null;
    }
  });

  useEffect(() => {
    if (isInitialMount.current) {
      console.log('[useChecklistState] Initial state set up:', {
        arrivals: arrivals.length,
        departureAreas: departureAreas.length,
        currentView,
        selectedAreaId: selectedArea?.id
      });
      isInitialMount.current = false;
    }
  }, [arrivals.length, departureAreas.length, currentView, selectedArea]);

  const setCurrentView = useCallback((view: ChecklistType | null) => {
    console.log('[ChecklistState] Setting current view to:', view);
    setCurrentViewState(view);
    try {
      saveToStorage('hytteCurrentView', view);
    } catch (error) {
      console.error('[ChecklistState] Failed to save current view to storage:', error);
    }
  }, []);

  const selectArea = useCallback((area: ChecklistArea | null) => {
    console.log('[ChecklistState] Selecting area:', area?.id);
    setSelectedAreaState(area);
    try {
      saveToStorage('hytteSelectedAreaId', area?.id || null);
    } catch (error) {
      console.error('[ChecklistState] Failed to save selected area ID to storage:', error);
    }
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
