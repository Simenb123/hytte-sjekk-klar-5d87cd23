
import React, { memo, useCallback, useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import Logo from './Logo';
import { LogIn, LogOut } from 'lucide-react';

const MainMenu: React.FC = memo(() => {
  const { setCurrentView, isAllArrivalsCompleted, isAllDeparturesCompleted } = useChecklist();
  
  // Logg montering og avmontering for debugging
  useEffect(() => {
    console.log('[MainMenu] Component mounted');
    return () => {
      console.log('[MainMenu] Component unmounted');
    };
  }, []);
  
  const handleArrivalClick = useCallback(() => {
    console.log('[MainMenu] Setting view to arrival');
    setCurrentView('arrival');
  }, [setCurrentView]);
  
  const handleDepartureClick = useCallback(() => {
    console.log('[MainMenu] Setting view to departure');
    setCurrentView('departure');
  }, [setCurrentView]);
  
  console.log('[MainMenu] rendering');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <Logo />
      
      <div className="w-full max-w-xs space-y-4 mt-4">
        <button
          className={`hytte-button w-full flex items-center justify-center ${
            isAllArrivalsCompleted() 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white py-3 px-4 rounded-lg`}
          onClick={handleArrivalClick}
        >
          <LogIn className="mr-2" size={20} />
          Ankomst
        </button>
        
        <button
          className={`hytte-button w-full flex items-center justify-center ${
            isAllDeparturesCompleted() 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white py-3 px-4 rounded-lg`}
          onClick={handleDepartureClick}
        >
          <LogOut className="mr-2" size={20} />
          Avreise
        </button>
      </div>
    </div>
  );
});

MainMenu.displayName = 'MainMenu';

export default MainMenu;
