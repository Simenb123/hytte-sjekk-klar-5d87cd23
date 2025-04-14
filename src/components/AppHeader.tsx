
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
  
  // Only try to use ChecklistContext if we're on the checklist page
  const isChecklistPage = location.pathname.includes('/checklist');
  
  // Use context conditionally based on path
  let checklistContext;
  if (isChecklistPage) {
    try {
      checklistContext = useChecklist();
    } catch (error) {
      // Silent catch - we'll handle navigation fallbacks below
    }
  }

  const handleBack = () => {
    if (isChecklistPage && checklistContext) {
      if (checklistContext.selectedArea) {
        // If we're in an area, go back to departure view
        checklistContext.selectArea(null);
      } else if (checklistContext.currentView) {
        // If we're in a view but not in an area, go back to main menu
        checklistContext.setCurrentView(null);
      } else {
        navigate(-1);
      }
    } else {
      // If we're not on the checklist page or context is not available, use regular navigation
      navigate(-1);
    }
  };

  const handleHome = () => {
    if (isChecklistPage && checklistContext) {
      // Reset checklist state
      checklistContext.setCurrentView(null);
      checklistContext.selectArea(null);
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
