
import React, { memo } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import AreaButton from './AreaButton';

const DepartureAreas: React.FC = () => {
  const { departureAreas, selectArea } = useChecklist();
  
  console.log('DepartureAreas rendering', { areaCount: departureAreas.length });
  
  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Velg område</h3>
        
        {departureAreas && departureAreas.length > 0 ? (
          departureAreas.map((area) => (
            <AreaButton 
              key={area.id} 
              area={area} 
              onClick={() => selectArea(area)}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 p-4">
            Ingen områder funnet
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm mt-4">
        Alle områder må sjekkes før avreise
      </div>
    </div>
  );
};

export default memo(DepartureAreas);
