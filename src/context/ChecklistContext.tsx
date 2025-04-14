
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { ChecklistContextType } from '../types/checklist.types';
import { useChecklistState } from '../hooks/useChecklistState';

// Create the context with a more explicit undefined initial value
const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const state = useChecklistState();
  
  // Log state changes
  useEffect(() => {
    console.log('[ChecklistContext] Provider rendered with state:', { 
      currentView: state.currentView, 
      selectedAreaId: state.selectedArea?.id,
      arrivals: state.arrivals.length,
      departureAreas: state.departureAreas.length
    });
  }, [state]);

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
  
  console.log('[ChecklistContext] useChecklist called successfully');
  return context;
};
