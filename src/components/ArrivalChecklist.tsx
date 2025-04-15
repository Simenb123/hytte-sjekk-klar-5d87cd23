
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';

const ArrivalChecklist: React.FC = () => {
  const { arrivals, toggleArrivalItem } = useChecklist();
  
  // Log mounting but remove unmounting to prevent side effects
  useEffect(() => {
    console.log('[ArrivalChecklist] Component mounted with', { 
      itemCount: arrivals?.length || 0,
      arrivals: JSON.stringify(arrivals)
    });
    // No return function to prevent unmounting side effects
  }, [arrivals]);
  
  console.log('[ArrivalChecklist] rendering', { 
    itemCount: arrivals?.length || 0,
    hasItems: Array.isArray(arrivals) && arrivals.length > 0
  });
  
  // Additional safety check to handle potential undefined arrivals
  if (!arrivals) {
    console.error('[ArrivalChecklist] arrivals is undefined');
    return (
      <div className="p-4 text-center text-gray-500">
        Laster sjekkliste...
      </div>
    );
  }
  
  return (
    <div className="relative z-20">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {arrivals && arrivals.length > 0 ? (
          arrivals.map((item) => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              text={item.text}
              isCompleted={item.isCompleted}
              onToggle={() => toggleArrivalItem(item.id)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            Ingen ankomstpunkter funnet
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm mb-4">
        Kryss av alle punkter etter hvert som du fullfører dem
      </div>

      <Button className="w-full" variant="default">
        <LogIn className="mr-2 h-4 w-4" />
        Loggfør Ankomstsjekk
      </Button>
    </div>
  );
};

export default ArrivalChecklist;
