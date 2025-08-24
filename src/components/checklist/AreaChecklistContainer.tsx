
import React from 'react';
import AreaChecklistItem from './AreaChecklistItem';

interface AreaChecklistContainerProps {
  items: Array<{
    id: string;
    text: string;
    isCompleted: boolean;
    imageUrl?: string;
    assigned_to?: string | null;
    completedBy?: string;
  }>;
  onToggleItem: (id: string) => void;
}

const AreaChecklistContainer: React.FC<AreaChecklistContainerProps> = ({ items, onToggleItem }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Ingen punkter funnet i dette området
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
      {items.map((item) => (
        <AreaChecklistItem
          key={item.id}
          item={item}
          completedBy={item.completedBy}
          onToggle={onToggleItem}
        />
      ))}
    </div>
  );
};

export default React.memo(AreaChecklistContainer);
