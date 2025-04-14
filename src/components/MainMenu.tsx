
import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import Logo from './Logo';
import { LogIn, LogOut } from 'lucide-react';

const MainMenu: React.FC = () => {
  const { setCurrentView, isAllArrivalsCompleted, isAllDeparturesCompleted } = useChecklist();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Logo />
      
      <div className="w-full max-w-xs space-y-4 mt-4">
        <button
          className={`hytte-button w-full ${
            isAllArrivalsCompleted() 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          onClick={() => setCurrentView('arrival')}
        >
          <LogIn className="mr-2" size={20} />
          Ankomst
        </button>
        
        <button
          className={`hytte-button w-full ${
            isAllDeparturesCompleted() 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          onClick={() => setCurrentView('departure')}
        >
          <LogOut className="mr-2" size={20} />
          Avreise
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
