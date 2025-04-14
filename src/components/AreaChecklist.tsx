
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';

const AreaChecklist: React.FC = () => {
  const { selectedArea, toggleDepartureItem } = useChecklist();
  
  // Log mounting for debugging, but remove unmounting logs
  useEffect(() => {
    console.log('[AreaChecklist] Component mounted', { 
      selectedAreaId: selectedArea?.id,
      itemCount: selectedArea?.items?.length || 0
    });
    // No return function to prevent unmounting side effects
  }, [selectedArea?.id, selectedArea?.items?.length]);
  
  // Add more detailed logging
  console.log('[AreaChecklist] Rendering with', { 
    selectedAreaId: selectedArea?.id,
    hasItems: selectedArea?.items?.length > 0,
    selectedAreaObject: JSON.stringify(selectedArea)
  });
  
  // Safety check - if no area is selected, show a message
  if (!selectedArea) {
    console.log('[AreaChecklist] No area selected, rendering null');
    return (
      <div className="text-center p-8 text-gray-500">
        Ingen område valgt. Vennligst velg et område.
      </div>
    );
  }
  
  const handleToggleItem = (itemId: string) => {
    console.log('[AreaChecklist] Toggling item:', itemId);
    if (selectedArea && selectedArea.id) {
      toggleDepartureItem(selectedArea.id, itemId);
    } else {
      console.error('[AreaChecklist] Cannot toggle item, selectedArea is null or missing id');
    }
  };
  
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
};

export default AreaChecklist;
