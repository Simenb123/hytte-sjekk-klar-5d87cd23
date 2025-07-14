
import React, { useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface ChecklistItemProps {
  id: string;
  text: string;
  isCompleted: boolean;
  imageUrl?: string;
  onToggle: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  text,
  isCompleted,
  imageUrl,
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
      className="flex flex-col py-3 px-4 cursor-pointer hover:bg-gray-50"
      onClick={handleToggle}
      data-state={isCompleted ? 'checked' : 'unchecked'}
    >
      <div className="flex items-center">
        <div className="mr-3 flex-shrink-0">
          {isCompleted ? (
            <CheckSquare size={24} className="text-green-600" strokeWidth={2.5} />
          ) : (
            <Square size={24} className="text-gray-400" strokeWidth={2.5} />
          )}
        </div>
        <span className={`${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
          {text}
        </span>
      </div>
      {imageUrl && (
        <img src={imageUrl} alt="" className="mt-2 max-h-48 rounded" loading="lazy" />
      )}
    </div>
  );
};

export default React.memo(ChecklistItem);
