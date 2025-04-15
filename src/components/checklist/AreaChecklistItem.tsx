
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
  return (
    <ChecklistItem
      key={`${item.id}-${item.isCompleted}`}
      id={item.id}
      text={item.text}
      isCompleted={item.isCompleted}
      onToggle={() => onToggle(item.id)}
    />
  );
};

export default React.memo(AreaChecklistItem);

