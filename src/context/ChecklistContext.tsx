
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
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

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  // Load data from localStorage with initial values as fallback
  const [arrivals, setArrivals] = useState<ChecklistItem[]>(() => {
    try {
      const savedArrivals = localStorage.getItem('hytteArrivals');
      return savedArrivals ? JSON.parse(savedArrivals) : initialArrivals;
    } catch (error) {
      console.error('Error loading arrivals from localStorage', error);
      return initialArrivals;
    }
  });
  
  const [departureAreas, setDepartureAreas] = useState<ChecklistArea[]>(() => {
    try {
      const savedDepartures = localStorage.getItem('hytteDepartures');
      return savedDepartures ? JSON.parse(savedDepartures) : initialDepartureAreas;
    } catch (error) {
      console.error('Error loading departures from localStorage', error);
      return initialDepartureAreas;
    }
  });
  
  const [currentView, setCurrentView] = useState<ChecklistType | null>(null);
  const [selectedArea, setSelectedArea] = useState<ChecklistArea | null>(null);

  // Navigation function with useCallback to avoid unnecessary re-renders
  const handleSetCurrentView = useCallback((view: ChecklistType | null) => {
    console.log('Setting current view to:', view);
    setCurrentView(view);
  }, []);

  const selectArea = useCallback((area: ChecklistArea | null) => {
    console.log('Selecting area:', area?.id);
    setSelectedArea(area);
  }, []);

  const toggleArrivalItem = useCallback((id: string) => {
    setArrivals((prevItems) => {
      const newItems = prevItems.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      
      // Save to localStorage
      try {
        localStorage.setItem('hytteArrivals', JSON.stringify(newItems));
      } catch (error) {
        console.error('Error saving arrivals to localStorage', error);
      }
      
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

  const toggleDepartureItem = useCallback((areaId: string, itemId: string) => {
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
      try {
        localStorage.setItem('hytteDepartures', JSON.stringify(newAreas));
      } catch (error) {
        console.error('Error saving departures to localStorage', error);
      }
      
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

  const resetChecklists = useCallback(() => {
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

  console.log('ChecklistProvider rendering', { currentView, selectedAreaId: selectedArea?.id });

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
