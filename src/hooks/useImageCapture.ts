
import { useState, useRef } from 'react';

export function useImageCapture() {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const captureFromCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const selectFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.setAttribute('multiple', 'true');
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setIsCapturing(true);
      
      Promise.all(
        imageFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader.readAsDataURL(file);
          });
        })
      ).then(imageDataArray => {
        setCapturedImages(prev => [...prev, ...imageDataArray]);
        setIsCapturing(false);
      });
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setCapturedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    capturedImages,
    isCapturing,
    captureFromCamera,
    selectFromGallery,
    removeImage,
    clearAllImages,
    fileInputRef,
    handleFileSelect,
    hasImages: capturedImages.length > 0,
  };
}
