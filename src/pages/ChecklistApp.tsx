
import React, { memo, useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import Header from '../components/Header';

const ChecklistApp: React.FC = () => {
  const { currentView, selectedArea, setCurrentView, selectArea } = useChecklist();

  // Log initial mount and every render
  console.log('[ChecklistApp] Rendering:', { currentView, selectedAreaId: selectedArea?.id });
  
  // Log whenever state changes
  useEffect(() => {
    console.log('[ChecklistApp] State changed:', { currentView, selectedAreaId: selectedArea?.id });
  }, [currentView, selectedArea]);

  // Handle back button functionality within the checklist app
  const handleBack = () => {
    console.log('[ChecklistApp] handleBack called:', { currentView, selectedAreaId: selectedArea?.id });
    if (selectedArea) {
      selectArea(null);
    } else if (currentView) {
      setCurrentView(null);
    }
  };

  // Determine which view to show
  const renderContent = () => {
    console.log('[ChecklistApp] Rendering content for:', { currentView, selectedAreaId: selectedArea?.id });
    
    if (selectedArea) {
      return <AreaChecklist key="area-checklist" />;
    }

    switch (currentView) {
      case 'arrival':
        return <ArrivalChecklist key="arrival-checklist" />;
      case 'departure':
        return <DepartureAreas key="departure-areas" />;
      default:
        return <MainMenu key="main-menu" />;
    }
  };

  // Determine the header title based on current view and selected area
  const getHeaderTitle = () => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={getHeaderTitle()} 
        showBackButton={!!(currentView || selectedArea)} 
        showHomeButton={true}
        onBackClick={handleBack}
      />
      <div className="max-w-lg mx-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChecklistApp;
