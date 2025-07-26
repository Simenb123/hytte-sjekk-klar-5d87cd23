
import React, { useState, useRef } from 'react';
import { User, Loader2, Mic, Camera, Volume2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import aiHelperImage from '@/assets/ai-helper-monkey.png';
import InventoryTag from './InventoryTag';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isVoice?: boolean;
  isLoading?: boolean;
  analysis?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  image,
  isVoice = false,
  isLoading = false,
  analysis
}) => {
  const isUser = role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Parse content for inventory tags and convert to JSX
  const parseContentWithInventoryTags = (text: string) => {
    const inventoryTagRegex = /\[ITEM:([^:]+):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inventoryTagRegex.exec(text)) !== null) {
      // Add text before the tag
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add the inventory tag component
      const itemId = match[1];
      const itemName = match[2];
      parts.push(
        <InventoryTag key={`${itemId}-${match.index}`} itemId={itemId} itemName={itemName} />
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 1 ? parts : text;
  };
  
  return (
    <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
          <img 
            src={aiHelperImage} 
            alt="AI Hyttehjelper" 
            className="w-full h-full object-cover object-center scale-150"
            style={{ filter: 'brightness(1.1) contrast(1.2)' }}
          />
        </div>
      )}
      
      <div
        className={cn(
          "p-3 rounded-lg max-w-sm",
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none shadow-sm border"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Tenker...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="Sendt bilde"
                  className="max-w-full h-auto rounded border"
                />
                {isUser && (
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
                    <Camera className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            )}

            {analysis && (
              <p className="text-xs text-gray-500 whitespace-pre-wrap italic">
                {analysis}
              </p>
            )}
            
            <div className="flex items-start gap-2">
              {isVoice && isUser && (
                <Mic className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-70" />
              )}
              <div className="whitespace-pre-wrap m-0 text-sm flex flex-wrap items-center gap-1">
                {(() => {
                  const parsed = parseContentWithInventoryTags(content);
                  if (Array.isArray(parsed)) {
                    return parsed.map((part, index) => 
                      typeof part === 'string' ? (
                        <span key={index}>{part}</span>
                      ) : part
                    );
                  }
                  return parsed;
                })()}
              </div>
              {!isUser && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleSpeak}
                  className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
                >
                  {isSpeaking ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {isSpeaking ? 'Stopp opplesning' : 'Les opp melding'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          <User size={20} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
