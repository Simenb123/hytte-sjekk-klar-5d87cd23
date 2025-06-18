
import { useState } from 'react';

export type InventoryViewType = 'cards' | 'list';

export const useInventoryView = () => {
  const [viewType, setViewType] = useState<InventoryViewType>('cards');

  const toggleView = () => {
    setViewType(prev => prev === 'cards' ? 'list' : 'cards');
  };

  return {
    viewType,
    setViewType,
    toggleView
  };
};
