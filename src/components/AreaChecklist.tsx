
import React, { useEffect, useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';

const AreaChecklist: React.FC = () => {
  const { selectedArea, toggleDepartureItem } = useChecklist();
  
  // Lokal state for å sikre at UI oppdateres umiddelbart
  const [items, setItems] = useState(selectedArea?.items || []);
  
  // Oppdater lokal state når selectedArea endres
  useEffect(() => {
    if (selectedArea?.items) {
      setItems(selectedArea.items);
      console.log('[AreaChecklist] Items updated from context:', selectedArea.items);
    }
  }, [selectedArea]);
  
  // Logging for debugging
  useEffect(() => {
    console.log('[AreaChecklist] Component mounted', { 
      selectedAreaId: selectedArea?.id,
      itemCount: selectedArea?.items?.length || 0
    });
  }, [selectedArea?.id, selectedArea?.items?.length]);
  
  console.log('[AreaChecklist] Rendering with', { 
    selectedAreaId: selectedArea?.id,
    hasItems: selectedArea?.items?.length > 0,
    itemsCount: items.length
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
      // Oppdater lokal state umiddelbart for responsiv UX
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        )
      );
      
      // Deretter oppdater global state
      toggleDepartureItem(selectedArea.id, itemId);
    } else {
      console.error('[AreaChecklist] Cannot toggle item, selectedArea is null or missing id');
    }
  };
  
  return (
    <div className="relative z-20">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {items && items.length > 0 ? (
          items.map((item) => (
            <ChecklistItem
              key={`${item.id}-${item.isCompleted}`}
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
