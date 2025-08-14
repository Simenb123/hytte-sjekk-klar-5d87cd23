import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
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
      Alert.alert('Feil', 'Velg et bilde først');
      return;
    }

    try {
      const result = await generateSilhouette(selectedFile);
      if (result) {
        onSilhouetteGenerated(result.silhouette);
        Alert.alert('Suksess', result.message);
        setSelectedFile(null);
      }
    } catch (err) {
      Alert.alert('Feil', 'Kunne ikke generere silhuett');
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: '#2A2F3A', borderRadius: 12, marginVertical: 8 }}>
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
        Mamma's Silhuett
      </Text>
      
      {currentSilhouette && (
        <View style={{ marginBottom: 12, alignItems: 'center' }}>
          <img 
            src={currentSilhouette} 
            alt="Current silhouette" 
            style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#1F2430' }}
          />
          <Text style={{ color: '#9AA0A6', fontSize: 12, marginTop: 4 }}>
            Nåværende silhuett
          </Text>
        </View>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{
          marginBottom: 12,
          padding: 8,
          backgroundColor: '#1F2430',
          color: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #3A3F4A',
          width: '100%'
        }}
      />

      {selectedFile && (
        <Text style={{ color: '#9AA0A6', fontSize: 14, marginBottom: 12 }}>
          Valgt: {selectedFile.name}
        </Text>
      )}

      <Pressable
        onPress={handleGenerateSilhouette}
        disabled={!selectedFile || loading}
        style={{
          backgroundColor: selectedFile && !loading ? '#0B63A8' : '#3A3F4A',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {loading ? 'Genererer silhuett...' : 'Generer Silhuett'}
        </Text>
      </Pressable>

      {error && (
        <Text style={{ color: '#FF7373', fontSize: 14, marginTop: 8 }}>
          {error}
        </Text>
      )}
    </View>
  );
};