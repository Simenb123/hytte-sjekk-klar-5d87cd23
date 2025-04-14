
import React from 'react';
import { ChecklistProvider, useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';

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
      <div className="max-w-lg mx-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <ChecklistProvider>
      <HytteApp />
    </ChecklistProvider>
  );
};

export default Index;
