import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SilhouetteResult {
  silhouette: string; // base64 image data
  message: string;
}

export function useSilhouetteGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSilhouette = async (imageFile: File): Promise<SilhouetteResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(imageFile);
      const imageBase64 = await base64Promise;

      // Call Supabase edge function
      const { data, error: functionError } = await supabase.functions.invoke('generate-silhouette', {
        body: { imageBase64 }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.silhouette) {
        throw new Error('No silhouette data received');
      }

      return {
        silhouette: `data:image/png;base64,${data.silhouette}`,
        message: data.message
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate silhouette';
      setError(errorMessage);
      console.error('Silhouette generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateSilhouette,
    loading,
    error
  };
}