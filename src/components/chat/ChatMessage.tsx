
import React, { useState, useRef } from 'react';
import { User, Loader2, Mic, Camera, Volume2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import aiHelperImage from '@/assets/ai-helper-monkey.png';
import InventoryTag from './InventoryTag';
import ActionSuggestions from './ActionSuggestions';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  image_url?: string;
  isVoice?: boolean;
  isLoading?: boolean;
  analysis?: string;
  suggestedActions?: Array<{
    type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
    label: string;
    confidence: number;
    reason: string;
  }>;
  actionData?: any;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  image,
  image_url,
  isVoice = false,
  isLoading = false,
  analysis,
  suggestedActions,
  actionData
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

  // Parse content for comprehensive markdown formatting and inventory tags
  const parseContentWithFormatting = (text: string) => {
    // Split content into paragraphs first
    const paragraphs = text.split('\n\n');
    const elements: React.ReactElement[] = [];
    
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (!paragraph.trim()) return;
      
      // Check if it's a numbered list
      if (/^\d+\.\s/.test(paragraph)) {
        const listItems = paragraph.split('\n').filter(line => /^\d+\.\s/.test(line));
        elements.push(
          <ol key={`ordered-list-${paragraphIndex}`} className="list-decimal list-inside space-y-1 my-2 ml-4">
            {listItems.map((item, itemIndex) => {
              const content = item.replace(/^\d+\.\s/, '');
              return (
                <li key={`li-${paragraphIndex}-${itemIndex}`} className="text-sm leading-relaxed">
                  {parseInlineFormatting(content, `li-${paragraphIndex}-${itemIndex}`)}
                </li>
              );
            })}
          </ol>
        );
      }
      // Check if it's a bullet list
      else if (/^[-*•]\s/.test(paragraph)) {
        const listItems = paragraph.split('\n').filter(line => /^[-*•]\s/.test(line));
        elements.push(
          <ul key={`unordered-list-${paragraphIndex}`} className="list-disc list-inside space-y-1 my-2 ml-4">
            {listItems.map((item, itemIndex) => {
              const content = item.replace(/^[-*•]\s/, '');
              return (
                <li key={`li-${paragraphIndex}-${itemIndex}`} className="text-sm leading-relaxed">
                  {parseInlineFormatting(content, `li-${paragraphIndex}-${itemIndex}`)}
                </li>
              );
            })}
          </ul>
        );
      }
      // Check if it's a heading (ends with colon and is on its own line)
      else if (/^[^:]+:$/.test(paragraph.trim()) && paragraph.split('\n').length === 1) {
        elements.push(
          <h4 key={`heading-${paragraphIndex}`} className="font-semibold text-sm mt-3 mb-2 text-gray-900 dark:text-gray-100">
            {paragraph.trim()}
          </h4>
        );
      }
      // Regular paragraph
      else {
        elements.push(
          <div key={`paragraph-${paragraphIndex}`} className="mb-4 last:mb-0 leading-relaxed">
            {parseInlineFormatting(paragraph, `paragraph-${paragraphIndex}`)}
          </div>
        );
      }
    });
    
    return elements.length > 1 ? elements : parseInlineFormatting(text, 'single');
  };

  // Parse inline formatting (bold, inventory tags) within a text segment
  const parseInlineFormatting = (text: string, keyPrefix: string) => {
    const parts: (string | React.ReactElement)[] = [];
    
    // First, split by inventory tags and preserve them
    const inventoryTagRegex = /(\[ITEM:[^:]+:[^\]]+\])/g;
    const segments = text.split(inventoryTagRegex);
    
    segments.forEach((segment, segmentIndex) => {
      if (segment.match(/^\[ITEM:([^:]+):([^\]]+)\]$/)) {
        // This is an inventory tag
        const match = segment.match(/^\[ITEM:([^:]+):([^\]]+)\]$/);
        if (match) {
          const itemId = match[1];
          const itemName = match[2];
          parts.push(
            <InventoryTag key={`${keyPrefix}-item-${itemId}-${segmentIndex}`} itemId={itemId} itemName={itemName} />
          );
        }
      } else {
        // Parse bold formatting in this segment
        const boldRegex = /(\*\*[^*]+\*\*)/g;
        const textParts = segment.split(boldRegex);
        
        textParts.forEach((part, partIndex) => {
          if (part.match(/^\*\*.*\*\*$/)) {
            // Bold text
            const boldText = part.replace(/^\*\*|\*\*$/g, '');
            parts.push(
              <strong key={`${keyPrefix}-bold-${segmentIndex}-${partIndex}`} className="font-semibold text-gray-900 dark:text-gray-100">
                {boldText}
              </strong>
            );
          } else if (part) {
            // Regular text - split by newlines for proper line breaks and ensure spaces
            const lines = part.split('\n');
            lines.forEach((line, lineIndex) => {
              if (lineIndex > 0) {
                parts.push(<br key={`${keyPrefix}-br-${segmentIndex}-${partIndex}-${lineIndex}`} />);
              }
              if (line) {
                parts.push(line);
              }
            });
          }
        });
      }
    });
    
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
          "p-4 rounded-lg max-w-md lg:max-w-lg",
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm border dark:border-gray-700"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Tenker...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {(image_url || image) && (
              <div className="relative">
                <img
                  src={image_url || image}
                  alt="Sendt bilde"
                  className="max-w-full h-auto rounded border cursor-pointer"
                  onClick={() => {
                    const imageSource = image_url || image;
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`<img src="${imageSource}" style="width: 100%; height: auto;" alt="Full size image">`);
                    }
                  }}
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
              <div className="text-sm leading-relaxed space-y-1">
                {(() => {
                  const parsed = parseContentWithFormatting(content);
                  if (Array.isArray(parsed)) {
                    return parsed;
                  }
                  return <div className="whitespace-pre-wrap">{parsed}</div>;
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
            
            {/* Action suggestions for assistant messages */}
            {!isUser && suggestedActions && suggestedActions.length > 0 && (
              <ActionSuggestions 
                actions={suggestedActions} 
                data={actionData}
                onActionTaken={() => {
                  // Optional: Add analytics or other side effects
                }}
              />
            )}
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
