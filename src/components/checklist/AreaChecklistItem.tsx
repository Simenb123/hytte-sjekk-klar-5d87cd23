
import React, { useEffect } from 'react';
import CompactChecklistItem from './CompactChecklistItem';

interface AreaChecklistItemProps {
  item: {
    id: string;
    text: string;
    isCompleted: boolean;
    imageUrl?: string;
    assigned_to?: string | null;
    app_name?: string | null;
    app_url_ios?: string | null;
    app_url_android?: string | null;
    app_icon_url?: string | null;
    app_description?: string | null;
  };
  onToggle: (id: string) => void;
  completedBy?: string | null;
}

const AreaChecklistItem: React.FC<AreaChecklistItemProps> = ({ item, onToggle, completedBy }) => {
  // Log when the component renders or when isCompleted changes
  useEffect(() => {
    console.log(`[AreaChecklistItem ${item.id}] Rendering with isCompleted: ${item.isCompleted}`);
  }, [item.id, item.isCompleted]);
  
  const handleToggle = () => {
    console.log(`[AreaChecklistItem ${item.id}] Toggling item, current state: ${item.isCompleted}`);
    onToggle(item.id);
  };
  
  return (
    <CompactChecklistItem
      id={item.id}
      text={item.text}
      isCompleted={item.isCompleted}
      imageUrl={item.imageUrl}
      assignedTo={item.assigned_to}
      completedBy={completedBy}
      onToggle={handleToggle}
      appName={item.app_name}
      appUrlIos={item.app_url_ios}
      appUrlAndroid={item.app_url_android}
      appIconUrl={item.app_icon_url}
      appDescription={item.app_description}
    />
  );
};

export default AreaChecklistItem;
