import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Wine, BookOpen, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ActionButtonProps {
  type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
  label: string;
  data?: any;
  onAction?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  type, 
  label, 
  data,
  onAction 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const getIcon = () => {
    switch (type) {
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'documents':
        return <FileText className="h-4 w-4" />;
      case 'wine':
        return <Wine className="h-4 w-4" />;
      case 'hyttebok':
        return <BookOpen className="h-4 w-4" />;
      case 'checklist':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'inventory':
        return 'default';
      case 'documents':
        return 'outline';
      case 'wine':
        return 'secondary';
      case 'hyttebok':
        return 'outline';
      case 'checklist':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleClick = () => {
    const queryParams = new URLSearchParams();
    
    switch (type) {
      case 'inventory':
        if (data) {
          queryParams.set('prefilledData', JSON.stringify(data));
        }
        navigate('/inventory?' + queryParams.toString());
        break;
      case 'documents':
        navigate('/documents');
        break;
      case 'wine':
        if (data) {
          queryParams.set('prefilledData', JSON.stringify(data));
        }
        navigate('/wine-cellar?' + queryParams.toString());
        break;
      case 'hyttebok':
        if (data?.description) {
          queryParams.set('draft', data.description);
        }
        navigate('/hyttebok?' + queryParams.toString());
        break;
      case 'checklist':
        toast({
          title: "Sjekklistepunkt foreslått",
          description: "Vi har lagt til ditt forslag i sjekklistesystemet.",
        });
        break;
    }
    
    onAction?.();
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      onClick={handleClick}
      className="flex items-center gap-2 text-xs"
    >
      {getIcon()}
      {label}
    </Button>
  );
};

export default ActionButton;