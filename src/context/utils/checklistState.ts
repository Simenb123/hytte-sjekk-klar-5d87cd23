
import { ChecklistState } from '../types/checklist.types';
import { initialArrivals, initialDepartureAreas } from '../../models/checklist';
import { loadFromStorage } from '../../utils/storage.utils';

export const getInitialState = (): ChecklistState => {
  try {
    console.log('[ChecklistContext] Initializing state from localStorage');
    
    const arrivals = loadFromStorage('hytteArrivals', initialArrivals);
    console.log('[ChecklistContext] Loaded arrivals:', arrivals.length);
    
    const departureAreas = loadFromStorage('hytteDepartures', initialDepartureAreas);
    console.log('[ChecklistContext] Loaded departure areas:', departureAreas.length);
    
    const currentView = loadFromStorage('hytteCurrentView', null);
    console.log('[ChecklistContext] Loaded current view:', currentView);
    
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
      isLoading: true, // Default to true when initializing
    };
  } catch (error) {
    console.error('[ChecklistContext] Error initializing state, using defaults', error);
    return {
      arrivals: initialArrivals,
      departureAreas: initialDepartureAreas,
      currentView: null,
      selectedArea: null,
      isLoading: true, // Default to true in error case
    };
  }
};
