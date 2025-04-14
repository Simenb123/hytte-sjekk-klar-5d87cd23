
import { useRef, useEffect } from 'react';
import { useChecklistData } from './useChecklistData';
import { useChecklistView } from './useChecklistView';
import { useChecklistActions } from './useChecklistActions';

export const useChecklistState = () => {
  const isInitialMount = useRef(true);
  const { arrivals, setArrivals, departureAreas, setDepartureAreas, isLoading } = useChecklistData();
  const { currentView, setCurrentView, selectedArea, selectArea } = useChecklistView();
  const { 
    toggleArrivalItem, 
    toggleDepartureItem, 
    isAllArrivalsCompleted, 
    isAllDeparturesCompleted 
  } = useChecklistActions(arrivals, setArrivals, departureAreas, setDepartureAreas);

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

  return {
    arrivals,
    departureAreas,
    currentView,
    selectedArea,
    isLoading,
    setCurrentView,
    selectArea,
    toggleArrivalItem,
    toggleDepartureItem,
    isAllArrivalsCompleted,
    isAllDeparturesCompleted
  };
};
