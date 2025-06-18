
import { useState } from 'react';

export type InventoryViewType = 'list' | 'grid';

export const useInventoryView = () => {
  const [viewType, setViewType] = useState<InventoryViewType>('grid');

  const toggleView = () => {
    setViewType(prev => prev === 'list' ? 'grid' : 'list');
  };

  return {
    viewType,
    setViewType,
    toggleView
  };
};
