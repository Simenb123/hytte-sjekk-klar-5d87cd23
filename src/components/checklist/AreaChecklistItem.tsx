
import React from 'react';
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

export default React.memo(AreaChecklistItem);
