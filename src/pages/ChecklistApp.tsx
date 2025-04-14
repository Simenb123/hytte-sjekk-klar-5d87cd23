
import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import AppHeader from '../components/AppHeader';

const ChecklistApp: React.FC = () => {
  const { currentView, selectedArea } = useChecklist();

  // Determine which view to show
  const renderContent = () => {
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
      <AppHeader 
        title={getHeaderTitle()} 
        showBackButton={!!(currentView || selectedArea)} 
        showHomeButton={true} 
      />
      <div className="max-w-lg mx-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChecklistApp;
