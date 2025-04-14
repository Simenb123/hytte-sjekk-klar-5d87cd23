
import React, { memo } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';

const AreaChecklist: React.FC = () => {
  const { selectedArea, toggleDepartureItem } = useChecklist();
  
  console.log('AreaChecklist rendering', { selectedArea: selectedArea?.id });
  
  if (!selectedArea) return null;
  
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
              onToggle={() => toggleDepartureItem(selectedArea.id, item.id)}
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

export default memo(AreaChecklist);
