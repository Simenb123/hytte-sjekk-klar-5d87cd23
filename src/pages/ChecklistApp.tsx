
import React from 'react';
import { ChecklistProvider, useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import AppHeader from '../components/AppHeader';

const HytteApp: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hytte-sjekk-klar" showHomeButton={true} />
      <div className="max-w-lg mx-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

const ChecklistApp: React.FC = () => {
  return (
    <ChecklistProvider>
      <HytteApp />
    </ChecklistProvider>
  );
};

export default ChecklistApp;
