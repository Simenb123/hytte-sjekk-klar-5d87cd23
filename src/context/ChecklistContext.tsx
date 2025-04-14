
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { ChecklistItem, ChecklistArea, initialArrivals, initialDepartureAreas, ChecklistType } from '../models/checklist';
import { toast } from 'sonner';

interface ChecklistContextType {
  arrivals: ChecklistItem[];
  departureAreas: ChecklistArea[];
  currentView: ChecklistType | null;
  selectedArea: ChecklistArea | null;
  
  // Navigation functions
  setCurrentView: (view: ChecklistType | null) => void;
  selectArea: (area: ChecklistArea | null) => void;
  
  // Checklist functions
  toggleArrivalItem: (id: string) => void;
  toggleDepartureItem: (areaId: string, itemId: string) => void;
  resetChecklists: () => void;
  isAllArrivalsCompleted: () => boolean;
  isAllDeparturesCompleted: () => boolean;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

// Load data from localStorage
const loadFromStorage = (key: string, fallback: any) => {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : fallback;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return fallback;
  }
};

// Save data to localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with data from localStorage or fallback to initial values
  const [arrivals, setArrivals] = useState<ChecklistItem[]>(() => 
    loadFromStorage('hytteArrivals', initialArrivals)
  );
  
  const [departureAreas, setDepartureAreas] = useState<ChecklistArea[]>(() => 
    loadFromStorage('hytteDepartures', initialDepartureAreas)
  );
  
  // Initialize view state
  const [currentView, setCurrentView] = useState<ChecklistType | null>(null);
  const [selectedArea, setSelectedArea] = useState<ChecklistArea | null>(null);

  // Log state changes
  useEffect(() => {
    console.log('[ChecklistContext] State updated:', { 
      currentView, 
      selectedAreaId: selectedArea?.id,
      arrivals: arrivals.length,
      departureAreas: departureAreas.length
    });
  }, [currentView, selectedArea, arrivals, departureAreas]);

  // Navigation functions with useCallback to avoid unnecessary re-renders
  const handleSetCurrentView = useCallback((view: ChecklistType | null) => {
    console.log('[ChecklistContext] Setting current view to:', view);
    setCurrentView(view);
  }, []);

  const selectArea = useCallback((area: ChecklistArea | null) => {
    console.log('[ChecklistContext] Selecting area:', area?.id);
    setSelectedArea(area);
  }, []);

  // Toggle arrival checklist item
  const toggleArrivalItem = useCallback((id: string) => {
    console.log('[ChecklistContext] Toggling arrival item:', id);
    setArrivals((prevItems) => {
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      
      // Save to localStorage
      saveToStorage('hytteArrivals', newItems);
      
      // Check if all items are completed
      const allCompleted = newItems.every(item => item.isCompleted);
      if (allCompleted) {
        toast("Velkommen til hytta! Kos deg på turen 😊", {
          position: "top-center",
        });
      }
      
      return newItems;
    });
  }, []);

  // Toggle departure checklist item
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
      
      // Save to localStorage
      saveToStorage('hytteDepartures', newAreas);
      
      // Check if all areas are completed
      const allAreasCompleted = newAreas.every(area => area.isCompleted);
      if (allAreasCompleted) {
        toast("God tur hjem! Hytta er nå sikret 🏠", {
          position: "top-center",
        });
      }
      
      return newAreas;
    });
  }, []);

  // Reset all checklists
  const resetChecklists = useCallback(() => {
    console.log('[ChecklistContext] Resetting all checklists');
    setArrivals(initialArrivals);
    setDepartureAreas(initialDepartureAreas);
    setCurrentView(null);
    setSelectedArea(null);
    
    try {
      localStorage.removeItem('hytteArrivals');
      localStorage.removeItem('hytteDepartures');
    } catch (error) {
      console.error('Error removing items from localStorage', error);
    }
  }, []);

  // Check if all items are completed
  const isAllArrivalsCompleted = useCallback(() => {
    return arrivals.every((item) => item.isCompleted);
  }, [arrivals]);

  const isAllDeparturesCompleted = useCallback(() => {
    return departureAreas.every((area) => area.isCompleted);
  }, [departureAreas]);

  // Use useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    arrivals,
    departureAreas,
    currentView,
    selectedArea,
    setCurrentView: handleSetCurrentView,
    selectArea,
    toggleArrivalItem,
    toggleDepartureItem,
    resetChecklists,
    isAllArrivalsCompleted,
    isAllDeparturesCompleted,
  }), [
    arrivals, 
    departureAreas, 
    currentView, 
    selectedArea, 
    handleSetCurrentView, 
    selectArea, 
    toggleArrivalItem, 
    toggleDepartureItem, 
    resetChecklists, 
    isAllArrivalsCompleted, 
    isAllDeparturesCompleted
  ]);

  return (
    <ChecklistContext.Provider value={contextValue}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};
