
import React from 'react';
import { Bot, User, Loader2, Mic, Camera } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  
  return (
    <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
          <Bot size={20} />
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
              <p className="whitespace-pre-wrap m-0 text-sm">{content}</p>
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
