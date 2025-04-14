
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import Header from './Header';
import AreaButton from './AreaButton';
import { useNavigate } from 'react-router-dom';

const DepartureAreas: React.FC = () => {
  const { departureAreas, selectArea, currentView } = useChecklist();
  const navigate = useNavigate();
  
  // Safety check - if not in departure view, navigate back to the main menu
  useEffect(() => {
    if (currentView !== 'departure') {
      navigate('/checklist');
    }
  }, [currentView, navigate]);
  
  return (
    <div className="animate-fade-in">
      <Header 
        title="Avreisesjekk" 
        showBackButton 
        showHomeButton 
      />
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Velg område</h3>
        
        {departureAreas && departureAreas.map((area) => (
          <AreaButton 
            key={area.id} 
            area={area} 
            onClick={() => selectArea(area)}
          />
        ))}
      </div>
      
      <div className="text-center text-gray-500 text-sm">
        Alle områder må sjekkes før avreise
      </div>
    </div>
  );
};

export default DepartureAreas;
