
import React, { memo, useCallback } from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface ChecklistItemProps {
  id: string;
  text: string;
  isCompleted: boolean;
  onToggle: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = memo(({ 
  id, 
  text, 
  isCompleted, 
  onToggle 
}) => {
  console.log(`[ChecklistItem] Rendering item: ${id}, completed: ${isCompleted}`);
  
  const handleToggle = useCallback(() => {
    console.log(`[ChecklistItem] Toggling item: ${id}`);
    onToggle();
  }, [id, onToggle]);
  
  return (
    <div 
      className="flex items-center py-3 px-4 border-b border-gray-100 last:border-0 cursor-pointer"
      onClick={handleToggle}
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
});

ChecklistItem.displayName = 'ChecklistItem';

export default ChecklistItem;
