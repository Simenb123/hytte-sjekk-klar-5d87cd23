
import { ChecklistItem, ChecklistArea, ChecklistType } from '../../models/checklist';

// Define the state structure
export interface ChecklistState {
  arrivals: ChecklistItem[];
  departureAreas: ChecklistArea[];
  currentView: ChecklistType | null;
  selectedArea: ChecklistArea | null;
  isLoading: boolean;
}

// Define action types
export type ChecklistAction =
  | { type: 'SET_ARRIVALS'; payload: ChecklistItem[] }
  | { type: 'SET_DEPARTURE_AREAS'; payload: ChecklistArea[] }
  | { type: 'SET_CURRENT_VIEW'; payload: ChecklistType | null }
  | { type: 'SET_SELECTED_AREA'; payload: ChecklistArea | null }
  | { type: 'TOGGLE_ARRIVAL_ITEM'; payload: string }
  | { type: 'TOGGLE_DEPARTURE_ITEM'; payload: { areaId: string; itemId: string } }
  | { type: 'RESET_CHECKLISTS' }
  | { type: 'SET_LOADING'; payload: boolean };

export interface ChecklistContextType extends ChecklistState {
  dispatch: React.Dispatch<ChecklistAction>;
  setCurrentView: (view: ChecklistType | null) => void;
  selectArea: (area: ChecklistArea | null) => void;
  toggleArrivalItem: (id: string) => void;
  toggleDepartureItem: (areaId: string, itemId: string) => void;
  resetChecklists: () => void;
  isAllArrivalsCompleted: () => boolean;
  isAllDeparturesCompleted: () => boolean;
  setLoading: (isLoading: boolean) => void;
}
