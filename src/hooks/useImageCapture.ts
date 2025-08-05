
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
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsCapturing(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImages(prev => [...prev, imageData]);
        setIsCapturing(false);
      };
      reader.readAsDataURL(file);
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
