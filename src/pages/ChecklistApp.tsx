
import React, { memo } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import Header from '../components/Header';

const ChecklistApp: React.FC = () => {
  const { currentView, selectedArea, setCurrentView, selectArea } = useChecklist();

  // Handle back button functionality within the checklist app
  const handleBack = () => {
    if (selectedArea) {
      selectArea(null);
    } else if (currentView) {
      setCurrentView(null);
    }
  };

  // Determine which view to show
  const renderContent = () => {
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

  console.log('ChecklistApp rendering:', { currentView, selectedArea: selectedArea?.id });

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

export default memo(ChecklistApp);
