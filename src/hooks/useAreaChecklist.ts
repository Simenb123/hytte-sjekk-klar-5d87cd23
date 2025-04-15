
import { useState, useEffect, useCallback } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { ChecklistItem } from '../models/checklist';

export const useAreaChecklist = () => {
  const { selectedArea, toggleDepartureItem } = useChecklist();
  const [items, setItems] = useState<ChecklistItem[]>(selectedArea?.items || []);

  useEffect(() => {
    if (selectedArea?.items) {
      setItems(selectedArea.items);
      console.log('[useAreaChecklist] Items updated from context:', selectedArea.items);
    }
  }, [selectedArea]);

  const handleToggleItem = useCallback((itemId: string) => {
    console.log('[useAreaChecklist] Toggling item:', itemId);
    if (selectedArea && selectedArea.id) {
      toggleDepartureItem(selectedArea.id, itemId);
    } else {
      console.error('[useAreaChecklist] Cannot toggle item, selectedArea is null or missing id');
    }
  }, [selectedArea, toggleDepartureItem]);

  return {
    items,
    selectedArea,
    handleToggleItem
  };
};
