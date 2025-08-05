
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-2">
      {hasImages ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap gap-2 max-w-xs">
            {capturedImages.map((image, index) => (
              <div key={index} className="relative">
                <img 
                  src={image} 
                  alt={`Captured ${index + 1}`} 
                  className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={captureFromCamera}
              disabled={disabled || isCapturing}
              className="text-xs px-2 py-1"
            >
              + Flere bilder
            </Button>
            
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSendImages}
              disabled={disabled}
              className="text-xs px-3 py-1"
            >
              Send {capturedImages.length} bilde{capturedImages.length > 1 ? 'r' : ''}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={captureFromCamera}
            disabled={disabled || isCapturing}
            className="flex-1"
          >
            <Camera className="h-4 w-4" />
            <span className="sr-only">Ta bilde</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectFromGallery}
            disabled={disabled || isCapturing}
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="sr-only">Velg bilde</span>
          </Button>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageCaptureButton;
