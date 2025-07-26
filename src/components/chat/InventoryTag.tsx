import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InventoryTagProps {
  itemId: string;
  itemName: string;
}

const InventoryTag: React.FC<InventoryTagProps> = ({ itemId, itemName }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to inventory page with search for the specific item
    navigate('/inventory', { 
      state: { 
        highlightItemId: itemId,
        searchTerm: itemName
      } 
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="inline-flex items-center gap-1 h-auto py-1 px-2 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30 rounded-full"
    >
      <Package className="h-3 w-3" />
      <span>{itemName}</span>
    </Button>
  );
};

export default InventoryTag;