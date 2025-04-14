
import { useState, useCallback } from 'react';
import { ChecklistType, ChecklistArea } from '../models/checklist';
import { loadFromStorage, saveToStorage } from '../utils/storage.utils';

export const useChecklistView = () => {
  const [currentView, setCurrentViewState] = useState<ChecklistType | null>(() => {
    try {
      return loadFromStorage('hytteCurrentView', null);
    } catch (error) {
      console.error('[useChecklistView] Failed to load current view:', error);
      return null;
    }
  });
  
  const [selectedArea, setSelectedAreaState] = useState<ChecklistArea | null>(null);

  const setCurrentView = useCallback((view: ChecklistType | null) => {
    console.log('[ChecklistView] Setting current view to:', view);
    setCurrentViewState(view);
    try {
      saveToStorage('hytteCurrentView', view);
    } catch (error) {
      console.error('[ChecklistView] Failed to save current view to storage:', error);
    }
  }, []);

  const selectArea = useCallback((area: ChecklistArea | null) => {
    console.log('[ChecklistView] Selecting area:', area?.id);
    setSelectedAreaState(area);
    try {
      saveToStorage('hytteSelectedAreaId', area?.id || null);
    } catch (error) {
      console.error('[ChecklistView] Failed to save selected area ID to storage:', error);
    }
  }, []);

  return { currentView, setCurrentView, selectedArea, selectArea };
};
