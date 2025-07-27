import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  imageUrl: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewer({ imageUrl, itemName, open, onOpenChange }: ImageViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none">
        <div className="relative bg-background rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-background/80 hover:bg-background"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <AspectRatio ratio={1} className="bg-muted">
            <img
              src={imageUrl}
              alt={itemName}
              className="w-full h-full object-contain"
              style={{ maxHeight: '80vh' }}
            />
          </AspectRatio>
          
          <div className="p-4 bg-background border-t">
            <h3 className="font-semibold text-center">{itemName}</h3>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}