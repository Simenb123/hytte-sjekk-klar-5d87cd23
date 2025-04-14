
import React, { memo, useEffect, useState } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import Header from '../components/Header';

// Bruk stabile IDer for hver view-tilstand for å unngå unmounting
const VIEW_KEYS = {
  null: 'main-menu',
  arrival: 'arrival-checklist',
  departure: 'departure-areas'
};

const ChecklistApp = () => {
  const { currentView, selectedArea, setCurrentView, selectArea } = useChecklist();
  const [mounted, setMounted] = useState(false);
  
  // Sikre at komponenten er ferdig montert før vi prøver å rendere innholdet
  useEffect(() => {
    console.log('[ChecklistApp] Component mounting');
    
    // Use a delay to ensure the component is fully mounted
    const mountTimer = setTimeout(() => {
      setMounted(true);
      console.log('[ChecklistApp] Component fully mounted');
    }, 50);
    
    return () => {
      console.log('[ChecklistApp] Component unmounting');
      clearTimeout(mountTimer);
      setMounted(false);
    };
  }, []);

  // Log hver rendering for debugging
  console.log('[ChecklistApp] Rendering:', { 
    currentView, 
    selectedAreaId: selectedArea?.id, 
    mounted 
  });
  
  // Log når tilstanden endres
  useEffect(() => {
    if (mounted) {
      console.log('[ChecklistApp] State changed:', { 
        currentView, 
        selectedAreaId: selectedArea?.id 
      });
    }
  }, [currentView, selectedArea, mounted]);

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
    if (!mounted) {
      console.log('[ChecklistApp] Not rendering content because not mounted yet');
      return <div className="flex justify-center items-center min-h-[50vh]">Laster...</div>;
    }
    
    console.log('[ChecklistApp] Rendering content for:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
    
    // Bruk stabile komponenter med unike nøkler for å forhindre unmounting
    if (selectedArea) {
      return <AreaChecklist key={`area-${selectedArea.id}`} />;
    }

    switch (currentView) {
      case 'arrival':
        return <ArrivalChecklist key={VIEW_KEYS.arrival} />;
      case 'departure':
        return <DepartureAreas key={VIEW_KEYS.departure} />;
      default:
        return <MainMenu key={VIEW_KEYS.null} />;
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

export default memo(ChecklistApp);
