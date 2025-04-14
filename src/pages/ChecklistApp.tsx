
import React, { useEffect, useState, useCallback } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import MainMenu from '../components/MainMenu';
import ArrivalChecklist from '../components/ArrivalChecklist';
import DepartureAreas from '../components/DepartureAreas';
import AreaChecklist from '../components/AreaChecklist';
import Header from '../components/Header';

// Simple error boundary to help debug rendering issues
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <h2 className="font-bold">Noe gikk galt</h2>
          <p>{this.state.error?.message || 'Ukjent feil'}</p>
          <button 
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Prøv igjen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ChecklistApp = () => {
  const { 
    currentView, 
    selectedArea, 
    setCurrentView, 
    selectArea 
  } = useChecklist();
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Log mounting and state
  useEffect(() => {
    console.log('[ChecklistApp] Component mounted with', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
    
    // Mark as loaded after a small delay to ensure UI is ready
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Log explicit re-renders to debug when the component updates
  console.log('[ChecklistApp] Rendering with state:', { 
    currentView, 
    selectedAreaId: selectedArea?.id,
    isLoaded
  });

  // Memoize the back handler to prevent recreation on every render
  const handleBack = useCallback(() => {
    console.log('[ChecklistApp] handleBack called:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
    
    if (selectedArea) {
      selectArea(null);
    } else if (currentView) {
      setCurrentView(null);
    }
  }, [currentView, selectedArea, selectArea, setCurrentView]);

  // Determine which view to show based on current state
  const renderContent = useCallback(() => {
    console.log('[ChecklistApp] Rendering content for:', { 
      currentView, 
      selectedAreaId: selectedArea?.id 
    });
    
    // First check if selectedArea exists
    if (selectedArea) {
      return <ErrorBoundary><AreaChecklist /></ErrorBoundary>;
    }

    // Then check the current view
    switch (currentView) {
      case 'arrival':
        return <ErrorBoundary><ArrivalChecklist /></ErrorBoundary>;
      case 'departure':
        return <ErrorBoundary><DepartureAreas /></ErrorBoundary>;
      default:
        return <ErrorBoundary><MainMenu /></ErrorBoundary>;
    }
  }, [currentView, selectedArea]);

  // Determine the header title based on current view and selected area
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={getHeaderTitle()} 
        showBackButton={Boolean(currentView || selectedArea)}
        showHomeButton={true}
        onBackClick={handleBack}
      />
      
      <div className="max-w-lg mx-auto p-4 pt-24">
        {isLoaded ? renderContent() : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Laster innhold...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistApp;
