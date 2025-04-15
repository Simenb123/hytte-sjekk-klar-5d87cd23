import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import AreaButton from './AreaButton';
import { Button } from './ui/button';
import { LogIn, ArrowRight } from 'lucide-react';

const DepartureAreas: React.FC = () => {
  const { departureAreas, selectArea } = useChecklist();
  
  useEffect(() => {
    console.log('[DepartureAreas] Component mounted with', { areaCount: departureAreas.length });
    return () => {
      console.log('[DepartureAreas] Component unmounted');
    };
  }, [departureAreas.length]);
  
  console.log('[DepartureAreas] rendering', { areaCount: departureAreas.length });

  const handleAreaClick = (area) => {
    console.log('[DepartureAreas] Area clicked:', area.id);
    selectArea(area);
  };

  const handleNextArea = (currentIndex: number) => {
    if (currentIndex < departureAreas.length - 1) {
      selectArea(departureAreas[currentIndex + 1]);
    }
  };
  
  return (
    <div className="relative z-20">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Velg område</h3>
        
        {departureAreas && departureAreas.length > 0 ? (
          departureAreas.map((area, index) => (
            <div key={`${area.id}-${area.isCompleted}`} className="mb-3">
              <AreaButton 
                area={area} 
                onClick={() => handleAreaClick(area)}
              />
              {index < departureAreas.length - 1 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => handleNextArea(index)}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Neste Område
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 p-4">
            Ingen områder funnet
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm mb-4">
        Alle områder må sjekkes før avreise
      </div>

      <Button className="w-full" variant="default">
        <LogIn className="mr-2 h-4 w-4" />
        Loggfør Avreisesjekk
      </Button>
    </div>
  );
};

export default DepartureAreas;
