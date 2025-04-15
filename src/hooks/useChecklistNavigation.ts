
import { useCallback } from 'react';
import { useChecklist } from '../context/ChecklistContext';

export const useChecklistNavigation = () => {
  const { currentView, selectedArea, setCurrentView, selectArea } = useChecklist();

  const handleBack = useCallback(() => {
    console.log('[useChecklistNavigation] handleBack called:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
    
    if (selectedArea) {
      selectArea(null);
    } else if (currentView) {
      setCurrentView(null);
    }
  }, [currentView, selectedArea, selectArea, setCurrentView]);

  const getHeaderTitle = useCallback(() => {
    if (selectedArea) {
      return selectedArea.name;
    }
    
    switch (currentView) {
      case 'arrival':
        return 'Ankomstsjekk';
      case 'departure':
        return 'Avreisesjekk';
      default:
        return 'Hytte-sjekk-klar';
    }
  }, [currentView, selectedArea]);

  return {
    handleBack,
    getHeaderTitle,
    showBackButton: !!currentView || !!selectedArea
  };
};
