
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { ChecklistContextType } from '../types/checklist.types';
import { useChecklistState } from '../hooks/useChecklistState';

// Create the context with a more explicit undefined initial value
const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const state = useChecklistState();
  
  // Log state changes
  useEffect(() => {
    console.log('[ChecklistContext] State updated:', { 
      currentView: state.currentView, 
      selectedAreaId: state.selectedArea?.id,
      arrivals: state.arrivals.length,
      departureAreas: state.departureAreas.length
    });
  }, [state.currentView, state.selectedArea, state.arrivals, state.departureAreas]);

  return (
    <ChecklistContext.Provider value={state}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = (): ChecklistContextType => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    console.error('[ChecklistContext] useChecklist must be used within a ChecklistProvider');
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};
