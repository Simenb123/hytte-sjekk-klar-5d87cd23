
import React from 'react';
import { useAreaChecklist } from '../hooks/useAreaChecklist';
import AreaChecklistContainer from './checklist/AreaChecklistContainer';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useChecklist } from '../context/ChecklistContext';

const AreaChecklist: React.FC = () => {
  const { items, selectedArea } = useAreaChecklist();
  const { departureAreas, selectArea } = useChecklist();

  if (!selectedArea) {
    return (
      <div className="text-center p-8 text-gray-500">
        Ingen område valgt. Vennligst velg et område.
      </div>
    );
  }

  const currentIndex = departureAreas.findIndex(area => area.id === selectedArea.id);
  const nextArea = currentIndex < departureAreas.length - 1 ? departureAreas[currentIndex + 1] : null;

  const handleNextArea = () => {
    if (nextArea) {
      selectArea(nextArea);
    }
  };

  return (
    <div className="relative z-20">
      <AreaChecklistContainer 
        items={items} 
        onToggleItem={(id) => console.log('Toggle item:', id)} 
      />
      
      <div className="text-center text-gray-500 text-sm mb-4">
        Kryss av alle punkter før du går videre til neste område
      </div>

      {nextArea && (
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={handleNextArea}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Neste område: {nextArea.name}
        </Button>
      )}
    </div>
  );
};

export default AreaChecklist;
