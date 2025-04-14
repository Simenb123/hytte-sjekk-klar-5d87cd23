
import React, { useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Checkbox } from "./ui/checkbox";

interface ChecklistItemProps {
  id: string;
  text: string;
  isCompleted: boolean;
  onToggle: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ 
  id, 
  text, 
  isCompleted, 
  onToggle 
}) => {
  // Log when checkbox state changes to debug rendering
  useEffect(() => {
    console.log(`[ChecklistItem ${id}] isCompleted: ${isCompleted}`);
  }, [id, isCompleted]);
  
  const handleToggle = () => {
    console.log(`[ChecklistItem ${id}] Clicked, current state: ${isCompleted}, will toggle to: ${!isCompleted}`);
    onToggle();
  };
  
  return (
    <div 
      className="flex items-center py-3 px-4 border-b border-gray-100 last:border-0 cursor-pointer"
      onClick={handleToggle}
      data-state={isCompleted ? 'checked' : 'unchecked'}
    >
      <div className="mr-3">
        {isCompleted ? (
          <CheckSquare size={24} className="text-green-600" />
        ) : (
          <Square size={24} className="text-gray-400" />
        )}
      </div>
      <span className={`${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
        {text}
      </span>
    </div>
  );
};

export default React.memo(ChecklistItem);
