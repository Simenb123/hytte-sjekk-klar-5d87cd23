import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  imageUrl: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewer({ imageUrl, itemName, open, onOpenChange }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 4));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoom > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and position when dialog opens
  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none">
        <div className="relative bg-background rounded-lg overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-20 h-8 w-8 p-0 bg-background/80 hover:bg-background"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Zoom controls */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div 
            ref={containerRef}
            className="relative overflow-hidden bg-muted"
            style={{ height: '80vh' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={itemName}
              className={`w-full h-full object-contain transition-transform duration-200 ${
                zoom > 1 ? 'cursor-move' : 'cursor-zoom-in'
              }`}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
              onClick={zoom === 1 ? handleZoomIn : undefined}
              draggable={false}
            />
          </div>
          
          <div className="p-4 bg-background border-t">
            <h3 className="font-semibold text-center">{itemName}</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Zoom: {Math.round(zoom * 100)}%
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}