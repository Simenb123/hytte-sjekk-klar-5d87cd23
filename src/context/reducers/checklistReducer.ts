
import { ChecklistState, ChecklistAction } from '../types/checklist.types';
import { saveToStorage } from '../../utils/storage.utils';
import { toast } from 'sonner';

export const checklistReducer = (state: ChecklistState, action: ChecklistAction): ChecklistState => {
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
      
      saveToStorage('hytteArrivals', newArrivals);
      return { ...state, arrivals: newArrivals };
      
    case 'TOGGLE_DEPARTURE_ITEM':
      const { areaId, itemId } = action.payload;
      const newDepartureAreas = state.departureAreas.map((area) => {
        if (area.id !== areaId) return area;
        
        const newItems = area.items.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        
        return {
          ...area,
          items: newItems,
          isCompleted: newItems.every((item) => item.isCompleted),
        };
      });
      
      const allAreasCompleted = newDepartureAreas.every(area => area.isCompleted);
      if (allAreasCompleted) {
        toast("God tur hjem! Hytta er nå sikret 🏠", {
          position: "top-center",
        });
      }
      
      saveToStorage('hytteDepartures', newDepartureAreas);
      return { ...state, departureAreas: newDepartureAreas };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'RESET_CHECKLISTS':
      try {
        localStorage.removeItem('hytteArrivals');
        localStorage.removeItem('hytteDepartures');
        localStorage.removeItem('hytteCurrentView');
        localStorage.removeItem('hytteSelectedAreaId');
      } catch (error) {
        console.error('[ChecklistReducer] Error removing items from localStorage', error);
      }
      
      return {
        arrivals: [],
        departureAreas: [],
        currentView: null,
        selectedArea: null,
        isLoading: false
      };
      
    default:
      return state;
  }
};
