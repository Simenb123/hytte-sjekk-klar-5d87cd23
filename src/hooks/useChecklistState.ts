
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ChecklistItem, ChecklistArea, ChecklistType } from '../models/checklist';
import { loadFromStorage, saveToStorage } from '../utils/storage.utils';
import { useAuth } from '../context/AuthContext';
import { 
  getArrivalItemsWithStatus, 
  getDepartureAreasWithItems, 
  logItemCompletion 
} from '../services/checklist.service';
import { AreaWithItems, ChecklistItemWithStatus } from '../types/database.types';

export const useChecklistState = () => {
  const { user } = useAuth();
  const isInitialMount = useRef(true);
  
  const [arrivals, setArrivals] = useState<ChecklistItem[]>([]);
  const [departureAreas, setDepartureAreas] = useState<ChecklistArea[]>([]);
  
  const [currentView, setCurrentViewState] = useState<ChecklistType | null>(() => {
    try {
      return loadFromStorage('hytteCurrentView', null);
    } catch (error) {
      console.error('[useChecklistState] Failed to load current view, using null:', error);
      return null;
    }
  });
  
  const [selectedArea, setSelectedAreaState] = useState<ChecklistArea | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChecklists = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Load data from Supabase
        const [arrivalItems, departureAreasWithItems] = await Promise.all([
          getArrivalItemsWithStatus(user.id),
          getDepartureAreasWithItems(user.id)
        ]);
        
        // Convert to the format expected by the app
        const convertedArrivals = arrivalItems.map((item: ChecklistItemWithStatus): ChecklistItem => ({
          id: item.id,
          text: item.text,
          isCompleted: item.isCompleted
        }));
        
        const convertedDepartureAreas = departureAreasWithItems.map((area: AreaWithItems): ChecklistArea => ({
          id: area.id,
          name: area.name,
          isCompleted: area.isCompleted,
          items: area.items.map(item => ({
            id: item.id,
            text: item.text,
            isCompleted: item.isCompleted
          }))
        }));
        
        setArrivals(convertedArrivals);
        setDepartureAreas(convertedDepartureAreas);
        
        console.log('[useChecklistState] Loaded data from Supabase:', {
          arrivals: convertedArrivals.length,
          departureAreas: convertedDepartureAreas.length
        });
        
        // If we have a saved selectedAreaId, find that area in the loaded data
        const savedAreaId = localStorage.getItem('hytteSelectedAreaId');
        if (savedAreaId) {
          const area = convertedDepartureAreas.find(area => area.id === savedAreaId) || null;
          setSelectedAreaState(area);
        }
      } catch (error) {
        console.error('[useChecklistState] Error loading from Supabase:', error);
        toast.error('Kunne ikke laste sjekklister. Prøv igjen senere.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChecklists();
  }, [user]);

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

  const toggleArrivalItem = useCallback(async (id: string) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    
    console.log('[ChecklistContext] Toggling arrival item:', id);
    
    setArrivals((prevItems) => {
      const itemToToggle = prevItems.find(item => item.id === id);
      if (!itemToToggle) return prevItems;
      
      const newIsCompleted = !itemToToggle.isCompleted;
      
      // Log the change to the database
      logItemCompletion(user.id, id, newIsCompleted)
        .catch(error => {
          console.error('[toggleArrivalItem] Failed to log completion:', error);
          // If logging fails, we could revert the UI change here if needed
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
  }, [user]);

  const toggleDepartureItem = useCallback(async (areaId: string, itemId: string) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    
    console.log('[ChecklistContext] Toggling departure item:', { areaId, itemId });
    
    setDepartureAreas((prevAreas) => {
      const area = prevAreas.find(a => a.id === areaId);
      if (!area) return prevAreas;
      
      const itemToToggle = area.items.find(item => item.id === itemId);
      if (!itemToToggle) return prevAreas;
      
      const newIsCompleted = !itemToToggle.isCompleted;
      
      // Log the change to the database
      logItemCompletion(user.id, itemId, newIsCompleted)
        .catch(error => {
          console.error('[toggleDepartureItem] Failed to log completion:', error);
          // If logging fails, we could revert the UI change here if needed
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
  }, [user]);

  const resetChecklists = useCallback(async () => {
    if (!user) {
      toast.error('Du må være logget inn for å tilbakestille sjekklister');
      return;
    }
    
    console.log('[ChecklistContext] Resetting all checklists');
    
    try {
      // Reload data from Supabase to reset
      const [arrivalItems, departureAreasWithItems] = await Promise.all([
        getArrivalItemsWithStatus(user.id),
        getDepartureAreasWithItems(user.id)
      ]);
      
      // Convert to the format expected by the app
      const convertedArrivals = arrivalItems.map((item: ChecklistItemWithStatus): ChecklistItem => ({
        id: item.id,
        text: item.text,
        isCompleted: false // Reset to false
      }));
      
      const convertedDepartureAreas = departureAreasWithItems.map((area: AreaWithItems): ChecklistArea => ({
        id: area.id,
        name: area.name,
        isCompleted: false, // Reset to false
        items: area.items.map(item => ({
          id: item.id,
          text: item.text,
          isCompleted: false // Reset to false
        }))
      }));
      
      setArrivals(convertedArrivals);
      setDepartureAreas(convertedDepartureAreas);
      setCurrentViewState(null);
      setSelectedAreaState(null);
      
      toast.success('Sjekklister er tilbakestilt!');
      
      try {
        localStorage.removeItem('hytteCurrentView');
        localStorage.removeItem('hytteSelectedAreaId');
      } catch (error) {
        console.error('Error removing items from localStorage', error);
      }
    } catch (error) {
      console.error('[resetChecklists] Error:', error);
      toast.error('Kunne ikke tilbakestille sjekklister. Prøv igjen senere.');
    }
  }, [user]);

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
    isLoading
  };
};
