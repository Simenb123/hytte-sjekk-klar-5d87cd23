
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { ChecklistContextType } from '../types/checklist.types';
import { useChecklistState } from '../hooks/useChecklistState';

// Create the context with a default value to avoid undefined checks
const ChecklistContext = createContext<ChecklistContextType>({} as ChecklistContextType);

export const ChecklistProvider = ({ children }: { children: ReactNode }) => {
  const state = useChecklistState();
  
  // Log state changes but reduce frequency of logging
  useEffect(() => {
    console.log('[ChecklistContext] Provider state initialized with:', { 
      currentView: state.currentView, 
      selectedAreaId: state.selectedArea?.id,
      arrivals: state.arrivals.length,
      departureAreas: state.departureAreas.length
    });
  }, []); // Only log on initial mount

  return (
    <ChecklistContext.Provider value={state}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = (): ChecklistContextType => {
  const context = useContext(ChecklistContext);
  
  if (!context || Object.keys(context).length === 0) {
    console.error('[ChecklistContext] useChecklist: context is undefined or empty. Make sure ChecklistProvider wraps this component.');
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  
  return context;
};
