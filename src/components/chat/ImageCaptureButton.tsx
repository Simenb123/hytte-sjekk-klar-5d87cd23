
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Camera, Image as ImageIcon, X, Send } from 'lucide-react';
import { useImageCapture } from '@/hooks/useImageCapture';

interface ImageCaptureButtonProps {
  onImageCapture: (images: string[]) => void;
  disabled?: boolean;
}

const ImageCaptureButton: React.FC<ImageCaptureButtonProps> = ({ 
  onImageCapture, 
  disabled = false 
}) => {
  const { 
    capturedImages, 
    isCapturing, 
    captureFromCamera, 
    selectFromGallery, 
    removeImage,
    clearAllImages, 
    fileInputRef, 
    handleFileSelect,
    hasImages 
  } = useImageCapture();

  const handleSendImages = () => {
    if (hasImages) {
      onImageCapture(capturedImages);
      clearAllImages();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {hasImages ? (
          <div className="flex items-center gap-1">
            {/* Compact thumbnails */}
            <div className="flex gap-1 mr-2">
              {capturedImages.slice(0, 2).map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Captured ${index + 1}`} 
                    className="w-8 h-8 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-3 h-3 p-0 rounded-full"
                  >
                    <X className="h-1.5 w-1.5" />
                  </Button>
                </div>
              ))}
              {capturedImages.length > 2 && (
                <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center text-xs">
                  +{capturedImages.length - 2}
                </div>
              )}
            </div>
            
            {/* Add more button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectFromGallery}
                  disabled={disabled || isCapturing}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Legg til flere bilder</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Send button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSendImages}
                  disabled={disabled}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send {capturedImages.length} bilde{capturedImages.length > 1 ? 'r' : ''}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {/* Gallery button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectFromGallery}
                  disabled={disabled || isCapturing}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Velg fra bibliotek</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Camera button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureFromCamera}
                  disabled={disabled || isCapturing}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ta bilde med kamera</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
};

export default ImageCaptureButton;
