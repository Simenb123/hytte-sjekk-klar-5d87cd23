
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import Header from './Header';
import ChecklistItem from './ChecklistItem';
import { useNavigate } from 'react-router-dom';

const ArrivalChecklist: React.FC = () => {
  const { arrivals, toggleArrivalItem, currentView } = useChecklist();
  const navigate = useNavigate();
  
  // Safety check - if not in arrival view, navigate back to the main menu
  useEffect(() => {
    if (currentView !== 'arrival') {
      navigate('/checklist');
    }
  }, [currentView, navigate]);
  
  return (
    <div className="animate-fade-in">
      <Header 
        title="Ankomstsjekk" 
        showBackButton 
        showHomeButton 
      />
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {arrivals && arrivals.map((item) => (
          <ChecklistItem
            key={item.id}
            id={item.id}
            text={item.text}
            isCompleted={item.isCompleted}
            onToggle={() => toggleArrivalItem(item.id)}
          />
        ))}
      </div>
      
      <div className="text-center text-gray-500 text-sm">
        Kryss av alle punkter etter hvert som du fullfører dem
      </div>
    </div>
  );
};

export default ArrivalChecklist;
