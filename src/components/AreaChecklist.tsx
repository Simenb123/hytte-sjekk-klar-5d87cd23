
import React, { useEffect } from 'react';
import { useChecklist } from '../context/ChecklistContext';
import Header from './Header';
import ChecklistItem from './ChecklistItem';
import { useNavigate } from 'react-router-dom';

const AreaChecklist: React.FC = () => {
  const { selectedArea, toggleDepartureItem, currentView } = useChecklist();
  const navigate = useNavigate();
  
  // Safety check - if no area is selected, navigate back to the departure areas screen
  useEffect(() => {
    if (!selectedArea) {
      navigate('/checklist');
    }
  }, [selectedArea, navigate]);
  
  if (!selectedArea) return null;
  
  return (
    <div className="animate-fade-in">
      <Header 
        title={selectedArea.name} 
        showBackButton 
        showHomeButton 
      />
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {selectedArea.items && selectedArea.items.map((item) => (
          <ChecklistItem
            key={item.id}
            id={item.id}
            text={item.text}
            isCompleted={item.isCompleted}
            onToggle={() => toggleDepartureItem(selectedArea.id, item.id)}
          />
        ))}
      </div>
      
      <div className="text-center text-gray-500 text-sm">
        Kryss av alle punkter før du går videre til neste område
      </div>
    </div>
  );
};

export default AreaChecklist;
