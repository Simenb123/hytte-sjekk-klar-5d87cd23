
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { ChecklistArea } from '../models/checklist';

interface AreaButtonProps {
  area: ChecklistArea;
  onClick: () => void;
}

const AreaButton: React.FC<AreaButtonProps> = ({ area, onClick }) => {
  const completedItems = area.items.filter(item => item.isCompleted).length;
  const totalItems = area.items.length;
  const progress = Math.round((completedItems / totalItems) * 100);
  
  return (
    <button 
      className={`w-full p-4 mb-3 rounded-lg border-2 transition-all text-left flex flex-col
        ${area.isCompleted 
          ? 'bg-green-50 border-green-500' 
          : 'bg-white border-gray-200 hover:border-blue-300'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-lg">{area.name}</span>
        {area.isCompleted ? (
          <CheckCircle size={24} className="text-green-600" />
        ) : (
          <Circle size={24} className="text-gray-400" />
        )}
      </div>
      
      <div className="text-sm text-gray-500">
        {completedItems} av {totalItems} oppgaver fullført
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div 
          className={`h-2 rounded-full ${area.isCompleted ? 'bg-green-600' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </button>
  );
};

export default AreaButton;
