
import React, { memo } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';

const ArrivalChecklist: React.FC = () => {
  const { arrivals, toggleArrivalItem } = useChecklist();
  
  console.log('ArrivalChecklist rendering', { itemCount: arrivals.length });
  
  return (
    <div className="animate-fade-in">
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
      
      <div className="text-center text-gray-500 text-sm">
        Kryss av alle punkter etter hvert som du fullfører dem
      </div>
    </div>
  );
};

export default memo(ArrivalChecklist);
