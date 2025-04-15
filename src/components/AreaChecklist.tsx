
import React from 'react';
import { useAreaChecklist } from '../hooks/useAreaChecklist';
import AreaChecklistContainer from './checklist/AreaChecklistContainer';

const AreaChecklist: React.FC = () => {
  const { items, selectedArea, handleToggleItem } = useAreaChecklist();

  if (!selectedArea) {
    return (
      <div className="text-center p-8 text-gray-500">
        Ingen område valgt. Vennligst velg et område.
      </div>
    );
  }

  return (
    <div className="relative z-20">
      <AreaChecklistContainer 
        items={items} 
        onToggleItem={handleToggleItem} 
      />
      
      <div className="text-center text-gray-500 text-sm">
        Kryss av alle punkter før du går videre til neste område
      </div>
    </div>
  );
};

export default AreaChecklist;

