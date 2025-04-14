
import React, { createContext, useContext, ReactNode, useReducer, useEffect } from 'react';
import { ChecklistContextType } from './types/checklist.types';
import { checklistReducer } from './reducers/checklistReducer';
import { getInitialState } from './utils/checklistState';
import { saveToStorage } from '../utils/storage.utils';

// Create context with a default value
const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(checklistReducer, getInitialState());
  
  useEffect(() => {
    console.log('[ChecklistContext] Provider state updated:', { 
      currentView: state.currentView,
      selectedAreaId: state.selectedArea?.id,
      arrivals: state.arrivals.length,
      departureAreas: state.departureAreas.length
    });
  }, [state]);
  
  useEffect(() => {
    if (state.currentView !== undefined) {
      try {
        saveToStorage('hytteCurrentView', state.currentView);
      } catch (error) {
        console.error('[ChecklistContext] Failed to save current view to storage:', error);
      }
    }
  }, [state.currentView]);
  
  useEffect(() => {
    try {
      saveToStorage('hytteSelectedAreaId', state.selectedArea?.id || null);
    } catch (error) {
      console.error('[ChecklistContext] Failed to save selected area ID to storage:', error);
    }
  }, [state.selectedArea]);
  
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
