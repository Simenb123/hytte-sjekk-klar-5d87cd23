import React, { createContext, useContext, ReactNode, useReducer, useEffect, Dispatch } from 'react';
import { ChecklistItem, ChecklistArea, ChecklistType, initialArrivals, initialDepartureAreas } from '../models/checklist';
import { loadFromStorage, saveToStorage } from '../utils/storage.utils';
import { toast } from 'sonner';

// Define the state structure
interface ChecklistState {
  arrivals: ChecklistItem[];
  departureAreas: ChecklistArea[];
  currentView: ChecklistType | null;
  selectedArea: ChecklistArea | null;
}

// Define action types
type ChecklistAction =
  | { type: 'SET_ARRIVALS'; payload: ChecklistItem[] }
  | { type: 'SET_DEPARTURE_AREAS'; payload: ChecklistArea[] }
  | { type: 'SET_CURRENT_VIEW'; payload: ChecklistType | null }
  | { type: 'SET_SELECTED_AREA'; payload: ChecklistArea | null }
  | { type: 'TOGGLE_ARRIVAL_ITEM'; payload: string }
  | { type: 'TOGGLE_DEPARTURE_ITEM'; payload: { areaId: string; itemId: string } }
  | { type: 'RESET_CHECKLISTS' };

// Create a reducer function
const checklistReducer = (state: ChecklistState, action: ChecklistAction): ChecklistState => {
  console.log('[ChecklistReducer]', action.type, action.type !== 'RESET_CHECKLISTS' ? action.payload : 'No payload');
  
  switch (action.type) {
    case 'SET_ARRIVALS':
      return { ...state, arrivals: action.payload };
      
    case 'SET_DEPARTURE_AREAS':
      return { ...state, departureAreas: action.payload };
      
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
      
    case 'SET_SELECTED_AREA':
      return { ...state, selectedArea: action.payload };
      
    case 'TOGGLE_ARRIVAL_ITEM':
      const newArrivals = state.arrivals.map((item) =>
        item.id === action.payload ? { ...item, isCompleted: !item.isCompleted } : item
      );
      
      const allArrivalsCompleted = newArrivals.every(item => item.isCompleted);
      if (allArrivalsCompleted) {
        toast("Velkommen til hytta! Kos deg på turen 😊", {
          position: "top-center",
        });
      }
      
      // Persist to storage
      saveToStorage('hytteArrivals', newArrivals);
      
      return { ...state, arrivals: newArrivals };
      
    case 'TOGGLE_DEPARTURE_ITEM':
      const { areaId, itemId } = action.payload;
      const newDepartureAreas = state.departureAreas.map((area) => {
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
      
      const allAreasCompleted = newDepartureAreas.every(area => area.isCompleted);
      if (allAreasCompleted) {
        toast("God tur hjem! Hytta er nå sikret 🏠", {
          position: "top-center",
        });
      }
      
      // Persist to storage
      saveToStorage('hytteDepartures', newDepartureAreas);
      
      return { ...state, departureAreas: newDepartureAreas };
      
    case 'RESET_CHECKLISTS':
      // Clear localStorage
      try {
        localStorage.removeItem('hytteArrivals');
        localStorage.removeItem('hytteDepartures');
        localStorage.removeItem('hytteCurrentView');
        localStorage.removeItem('hytteSelectedAreaId');
      } catch (error) {
        console.error('[ChecklistReducer] Error removing items from localStorage', error);
      }
      
      return {
        arrivals: initialArrivals,
        departureAreas: initialDepartureAreas,
        currentView: null,
        selectedArea: null,
      };
      
    default:
      return state;
  }
};

// Initial state with localStorage fallback
const getInitialState = (): ChecklistState => {
  try {
    console.log('[ChecklistContext] Initializing state from localStorage');
    
    // Load arrivals
    const arrivals = loadFromStorage('hytteArrivals', initialArrivals);
    console.log('[ChecklistContext] Loaded arrivals:', arrivals.length);
    
    // Load departures
    const departureAreas = loadFromStorage('hytteDepartures', initialDepartureAreas);
    console.log('[ChecklistContext] Loaded departure areas:', departureAreas.length);
    
    // Load current view
    const currentView = loadFromStorage('hytteCurrentView', null);
    console.log('[ChecklistContext] Loaded current view:', currentView);
    
    // Load selected area
    const savedAreaId = localStorage.getItem('hytteSelectedAreaId');
    let selectedArea = null;
    
    if (savedAreaId) {
      console.log('[ChecklistContext] Found saved area ID:', savedAreaId);
      selectedArea = departureAreas.find(area => area.id === savedAreaId) || null;
      console.log('[ChecklistContext] Resolved to area object:', selectedArea?.id);
    }
    
    return {
      arrivals,
      departureAreas,
      currentView,
      selectedArea,
    };
  } catch (error) {
    console.error('[ChecklistContext] Error initializing state, using defaults', error);
    return {
      arrivals: initialArrivals,
      departureAreas: initialDepartureAreas,
      currentView: null,
      selectedArea: null,
    };
  }
};

// Create the context type
interface ChecklistContextType extends ChecklistState {
  dispatch: Dispatch<ChecklistAction>;
  setCurrentView: (view: ChecklistType | null) => void;
  selectArea: (area: ChecklistArea | null) => void;
  toggleArrivalItem: (id: string) => void;
  toggleDepartureItem: (areaId: string, itemId: string) => void;
  resetChecklists: () => void;
  isAllArrivalsCompleted: () => boolean;
  isAllDeparturesCompleted: () => boolean;
}

// Create context with a default value
const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  // Use reducer instead of multiple useState calls
  const [state, dispatch] = useReducer(checklistReducer, getInitialState());
  
  // Log state changes for debugging
  useEffect(() => {
    console.log('[ChecklistContext] Provider state updated:', { 
      currentView: state.currentView,
      selectedAreaId: state.selectedArea?.id,
      arrivals: state.arrivals.length,
      departureAreas: state.departureAreas.length
    });
  }, [state]);
  
  // Save current view to storage when it changes
  useEffect(() => {
    if (state.currentView !== undefined) {
      try {
        saveToStorage('hytteCurrentView', state.currentView);
      } catch (error) {
        console.error('[ChecklistContext] Failed to save current view to storage:', error);
      }
    }
  }, [state.currentView]);
  
  // Save selected area ID to storage when it changes
  useEffect(() => {
    try {
      saveToStorage('hytteSelectedAreaId', state.selectedArea?.id || null);
    } catch (error) {
      console.error('[ChecklistContext] Failed to save selected area ID to storage:', error);
    }
  }, [state.selectedArea]);
  
  // Helper functions to wrap dispatch actions
  const setCurrentView = (view: ChecklistType | null) => {
    console.log('[ChecklistContext] Setting current view to:', view);
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };
  
  const selectArea = (area: ChecklistArea | null) => {
    console.log('[ChecklistContext] Selecting area:', area?.id);
    dispatch({ type: 'SET_SELECTED_AREA', payload: area });
  };
  
  const toggleArrivalItem = (id: string) => {
    console.log('[ChecklistContext] Toggling arrival item:', id);
    dispatch({ type: 'TOGGLE_ARRIVAL_ITEM', payload: id });
  };
  
  const toggleDepartureItem = (areaId: string, itemId: string) => {
    console.log('[ChecklistContext] Toggling departure item:', { areaId, itemId });
    dispatch({ type: 'TOGGLE_DEPARTURE_ITEM', payload: { areaId, itemId } });
  };
  
  const resetChecklists = () => {
    console.log('[ChecklistContext] Resetting all checklists');
    dispatch({ type: 'RESET_CHECKLISTS' });
  };
  
  const isAllArrivalsCompleted = () => {
    return state.arrivals.every((item) => item.isCompleted);
  };
  
  const isAllDeparturesCompleted = () => {
    return state.departureAreas.every((area) => area.isCompleted);
  };
  
  // Value to provide to consumers
  const contextValue: ChecklistContextType = {
    ...state,
    dispatch,
    setCurrentView,
    selectArea,
    toggleArrivalItem,
    toggleDepartureItem,
    resetChecklists,
    isAllArrivalsCompleted,
    isAllDeparturesCompleted,
  };
  
  return (
    <ChecklistContext.Provider value={contextValue}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = (): ChecklistContextType => {
  const context = useContext(ChecklistContext);
  
  if (!context) {
    console.error('[ChecklistContext] useChecklist: context is undefined. Make sure ChecklistProvider wraps this component.');
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  
  return context;
};
