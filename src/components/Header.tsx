
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useChecklist } from '../context/ChecklistContext';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = false, 
  showHomeButton = false 
}) => {
  const { setCurrentView, selectArea } = useChecklist();

  const handleBack = () => {
    const { currentView, selectedArea } = useChecklist();
    
    if (selectedArea) {
      // If we're in an area, go back to departure view
      selectArea(null);
    } else if (currentView) {
      // If we're in a view but not in an area, go back to main menu
      setCurrentView(null);
    }
  };

  const handleHome = () => {
    setCurrentView(null);
    selectArea(null);
  };

  return (
    <div className="flex items-center justify-between py-4 mb-4">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        {title && <h2 className="text-xl font-semibold">{title}</h2>}
      </div>
      
      {showHomeButton && (
        <button 
          onClick={handleHome}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Home size={24} />
        </button>
      )}
    </div>
  );
};

export default Header;
