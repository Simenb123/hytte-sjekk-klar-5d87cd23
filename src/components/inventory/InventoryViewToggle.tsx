
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { InventoryViewType } from '@/hooks/useInventoryView';

interface InventoryViewToggleProps {
  viewType: InventoryViewType;
  onViewChange: (viewType: InventoryViewType) => void;
}

const InventoryViewToggle: React.FC<InventoryViewToggleProps> = ({ viewType, onViewChange }) => {
  return (
    <ToggleGroup type="single" value={viewType} onValueChange={(value) => {
      if (value) onViewChange(value as InventoryViewType);
    }}>
      <ToggleGroupItem value="cards" aria-label="Kort-visning">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Liste-visning">
        <LayoutList className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default InventoryViewToggle;
