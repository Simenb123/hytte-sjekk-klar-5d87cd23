
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useImageCapture } from '@/hooks/useImageCapture';

interface ImageCaptureButtonProps {
  onImageCapture: (image: string) => void;
  disabled?: boolean;
}

const ImageCaptureButton: React.FC<ImageCaptureButtonProps> = ({ 
  onImageCapture, 
  disabled = false 
}) => {
  const { 
    capturedImage, 
    isCapturing, 
    captureFromCamera, 
    selectFromGallery, 
    clearImage, 
    fileInputRef, 
    handleFileSelect 
  } = useImageCapture();

  const handleSendImage = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      clearImage();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {capturedImage ? (
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-16 h-16 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSendImage}
            disabled={disabled}
          >
            Send bilde
          </Button>
        </div>
      ) : (
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={captureFromCamera}
            disabled={disabled || isCapturing}
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
