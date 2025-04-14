
import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useChecklist } from '../context/ChecklistContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  showBackButton = false, 
  showHomeButton = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentView, selectArea } = useChecklist();

  const handleBack = () => {
    const { currentView, selectedArea } = useChecklist();
    
    if (selectedArea) {
      // If we're in an area, go back to departure view
      selectArea(null);
    } else if (currentView) {
      // If we're in a view but not in an area, go back to main menu
      setCurrentView(null);
    } else if (location.pathname !== '/') {
      // If we're not on the dashboard, go back to previous page
      navigate(-1);
    }
  };

  const handleHome = () => {
    if (location.pathname === '/checklist') {
      // If in checklist app, reset checklist state
      setCurrentView(null);
      selectArea(null);
    } else {
      // Navigate to dashboard
      navigate('/');
    }
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between py-4 px-4">
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
      </div>
    </div>
  );
};

export default AppHeader;
