import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WineTagProps {
  wineId: string;
  wineName: string;
}

const WineTag: React.FC<WineTagProps> = ({ wineId, wineName }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/wine-cellar', { 
      state: { 
        highlightWineId: wineId,
        searchTerm: wineName
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
      <Wine className="h-3 w-3" />
      <span>{wineName}</span>
    </Button>
  );
};

export default WineTag;
