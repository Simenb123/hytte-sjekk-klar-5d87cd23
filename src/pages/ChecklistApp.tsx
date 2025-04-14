
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import Header from '../components/Header';

const ChecklistApp = () => {
  const { currentView, selectedArea, setCurrentView, selectArea } = useChecklist();
  
  useEffect(() => {
    console.log('[ChecklistApp] Component mounted with', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });

    return () => {
      console.log('[ChecklistApp] Component unmounting');
    };
  }, []);
  
  // Log når tilstanden endres
  useEffect(() => {
    console.log('[ChecklistApp] State changed:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
  }, [currentView, selectedArea]);

  // Håndterer tilbakeknapp-funksjonalitet i sjekklisteappen
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

  // Bestemmer hvilken visning som skal vises
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

  // Bestemmer overskriften basert på gjeldende visning og valgt område
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

// Fjernet memo for å sikre at komponenten renderes på nytt når konteksten endres
export default ChecklistApp;
