
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface VoiceRecordButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({ 
  onTranscription, 
  disabled = false 
}) => {
  const { isRecording, isTranscribing, error, startRecording, stopRecording } = useVoiceRecording();

  const handleClick = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        onTranscription(transcribedText);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={disabled || isTranscribing}
        className={`${isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600 scale-110' : ''} transition-all duration-200`}
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        <span className="sr-only">
          {isRecording ? 'Stopp opptak' : 'Start opptak'}
        </span>
      </Button>
      
      {error && (
        <span className="text-xs text-red-500 text-center max-w-20">
          {error}
        </span>
      )}
      
      {isRecording && (
        <span className="text-xs text-red-500 animate-pulse font-medium">
          Tar opp...
        </span>
      )}
      
      {isTranscribing && (
        <span className="text-xs text-blue-500">
          Behandler...
        </span>
      )}
    </div>
  );
};

export default VoiceRecordButton;
