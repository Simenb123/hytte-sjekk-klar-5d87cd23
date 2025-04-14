
import React, { memo, useCallback, useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';

const AreaChecklist: React.FC = memo(() => {
  const { selectedArea, toggleDepartureItem } = useChecklist();
  
  // Logg montering og avmontering for debugging
  useEffect(() => {
    console.log('[AreaChecklist] Component mounted', { selectedAreaId: selectedArea?.id });
    return () => {
      console.log('[AreaChecklist] Component unmounted');
    };
  }, [selectedArea]);
  
  console.log('[AreaChecklist] rendering', { selectedArea: selectedArea?.id });
  
  if (!selectedArea) {
    console.log('[AreaChecklist] No area selected, rendering null');
    return null;
  }
  
  const handleToggleItem = useCallback((itemId: string) => {
    console.log('[AreaChecklist] Toggling item:', itemId);
    if (selectedArea) {
      toggleDepartureItem(selectedArea.id, itemId);
    }
  }, [selectedArea, toggleDepartureItem]);
  
  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {selectedArea.items && selectedArea.items.length > 0 ? (
          selectedArea.items.map((item) => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              text={item.text}
              isCompleted={item.isCompleted}
              onToggle={() => handleToggleItem(item.id)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            Ingen punkter funnet i dette området
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm">
        Kryss av alle punkter før du går videre til neste område
      </div>
    </div>
  );
});

AreaChecklist.displayName = 'AreaChecklist';

export default AreaChecklist;
