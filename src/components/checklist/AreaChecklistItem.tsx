
import React, { useEffect } from 'react';
import ChecklistItem from '../ChecklistItem';

interface AreaChecklistItemProps {
  item: {
    id: string;
    text: string;
    isCompleted: boolean;
  };
  onToggle: (id: string) => void;
}

const AreaChecklistItem: React.FC<AreaChecklistItemProps> = ({ item, onToggle }) => {
  // Log when the component renders or when isCompleted changes
  useEffect(() => {
    console.log(`[AreaChecklistItem ${item.id}] Rendering with isCompleted: ${item.isCompleted}`);
  }, [item.id, item.isCompleted]);
  
  const handleToggle = () => {
    console.log(`[AreaChecklistItem ${item.id}] Toggling item, current state: ${item.isCompleted}`);
    onToggle(item.id);
  };
  
  return (
    <ChecklistItem
      id={item.id}
      text={item.text}
      isCompleted={item.isCompleted}
      onToggle={handleToggle}
    />
  );
};

// Use a more explicit comparison function for memoization
export default React.memo(AreaChecklistItem, (prevProps, nextProps) => {
  return prevProps.item.isCompleted === nextProps.item.isCompleted &&
         prevProps.item.id === nextProps.item.id &&
         prevProps.item.text === nextProps.item.text;
});
