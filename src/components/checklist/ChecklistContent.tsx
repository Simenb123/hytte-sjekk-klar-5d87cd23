
import React from 'react';
import { useChecklist } from '../../context/ChecklistContext';
import MainMenu from '../MainMenu';
import ArrivalChecklist from '../ArrivalChecklist';
import DepartureAreas from '../DepartureAreas';
import AreaChecklist from '../AreaChecklist';

const ChecklistContent = () => {
  const { currentView, selectedArea } = useChecklist();
  
  console.log('[ChecklistContent] Rendering content for:', { 
    currentView, 
    selectedAreaId: selectedArea?.id 
  });
  
  if (selectedArea) {
    return <AreaChecklist />;
  }

  switch (currentView) {
    case 'arrival':
      return <ArrivalChecklist />;
    case 'departure':
      return <DepartureAreas />;
    default:
      return <MainMenu />;
  }
};

export default ChecklistContent;
