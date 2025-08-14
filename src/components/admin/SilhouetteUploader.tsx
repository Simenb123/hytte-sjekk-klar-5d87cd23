import React, { useState } from 'react';
import { useSilhouetteGenerator } from '@/hooks/useSilhouetteGenerator';

interface SilhouetteUploaderProps {
  onSilhouetteGenerated: (silhouetteUrl: string) => void;
  currentSilhouette?: string | null;
}

export const SilhouetteUploader: React.FC<SilhouetteUploaderProps> = ({
  onSilhouetteGenerated,
  currentSilhouette
}) => {
  const { generateSilhouette, loading, error } = useSilhouetteGenerator();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleGenerateSilhouette = async () => {
    if (!selectedFile) {
      alert('Velg et bilde først');
      return;
    }

    try {
      const result = await generateSilhouette(selectedFile);
      if (result) {
        onSilhouetteGenerated(result.silhouette);
        alert(`Suksess: ${result.message}`);
        setSelectedFile(null);
      }
    } catch (err) {
      alert('Kunne ikke generere silhuett');
    }
  };

  return (
    <div className="p-4 bg-gray-700 rounded-xl my-2">
      <h4 className="text-white text-lg font-semibold mb-3">
        Mamma's Silhuett
      </h4>
      
      {currentSilhouette && (
        <div className="mb-3 text-center">
          <img 
            src={currentSilhouette} 
            alt="Current silhouette" 
            className="w-15 h-15 rounded-full bg-gray-800 mx-auto"
          />
          <div className="text-gray-400 text-sm mt-1">
            Nåværende silhuett
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="w-full mb-3 p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
      />

      {selectedFile && (
        <div className="text-gray-400 text-sm mb-3">
          Valgt: {selectedFile.name}
        </div>
      )}

      <button
        onClick={handleGenerateSilhouette}
        disabled={!selectedFile || loading}
        className={`w-full px-4 py-3 rounded-lg text-white font-semibold ${
          selectedFile && !loading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {loading ? 'Genererer silhuett...' : 'Generer Silhuett'}
      </button>

      {error && (
        <div className="text-red-400 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
};