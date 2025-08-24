import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageThumbnailProps {
  imageUrl: string;
  alt: string;
  onClick: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ImageThumbnail({ imageUrl, alt, onClick, onDelete, className = "" }: ImageThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className={`relative group cursor-pointer ${className}`}>
      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
        {imageError ? (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
            )}
            <img
              src={imageUrl}
              alt={alt}
              onClick={onClick}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </>
        )}
      </div>
      
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteClick}
          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}