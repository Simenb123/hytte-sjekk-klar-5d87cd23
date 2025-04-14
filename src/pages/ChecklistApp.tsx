
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import Header from '../components/Header';

const ChecklistApp = () => {
  const { currentView, selectedArea, setCurrentView, selectArea } = useChecklist();
  
  // Log only on initial mount to reduce console noise
  useEffect(() => {
    console.log('[ChecklistApp] Component mounted with', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });

    return () => {
      console.log('[ChecklistApp] Component unmounting');
    };
  }, []);
  
  // Separate effect for logging state changes
  useEffect(() => {
    console.log('[ChecklistApp] State changed:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
  }, [currentView, selectedArea]);

  // Handle back button functionality
  const handleBack = () => {
    console.log('[ChecklistApp] handleBack called:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
    
    if (selectedArea) {
      selectArea(null);
    } else if (currentView) {
      setCurrentView(null);
    }
  };

  // Determine which view to show based on current state
  const renderContent = () => {
    console.log('[ChecklistApp] Rendering content for:', { 
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

// Export directly without memo to ensure proper re-rendering
export default ChecklistApp;
