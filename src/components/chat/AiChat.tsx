import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Trash2, Plus } from "lucide-react";
import ChatMessage from "./ChatMessage";
import VoiceRecordButton from "./VoiceRecordButton";
import ImageCaptureButton from "./ImageCaptureButton";
import PromptSuggestions from "./PromptSuggestions";
import ActionSuggestions from './ActionSuggestions';
import LoadingIndicator from './LoadingIndicator';
import { useAiChat, ChatMessage as ChatMessageType } from "@/hooks/useAiChat";
import { useChatSession } from "@/hooks/useChatSession";
import aiHelperImage from '@/assets/ai-helper-monkey.png';

const AiChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [latestActions, setLatestActions] = useState<{
    suggestedActions?: Array<{
      type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
      label: string;
      confidence: number;
      reason: string;
    }>;
    actionData?: any;
  }>({});
  const { sendMessage, loading, error } = useAiChat();
  const { 
    messages, 
    saveMessage, 
    clearSession, 
    loading: sessionLoading,
    currentSession 
  } = useChatSession();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Add welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: 'welcome',
      role: 'assistant' as const,
      content: 'Hei! Jeg er din personlige hyttehjelper. Du kan spørre meg med tekst, lyd eller bilder om hva som helst som har med hytta å gjøre! Prøv for eksempel:\n\n• Ta et bilde av en gjenstand for identifikasjon\n• Spør med stemmen din mens du har hendene opptatt\n• Be om hjelp med vedlikehold eller problemer',
      session_id: '',
      created_at: ''
    }
  ] : messages;

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // max 5-6 lines
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSend = async (messageText?: string, image?: string) => {
    const textToSend = messageText || input.trim();
    const imageToSend = image || pendingImage;
    
    if (textToSend === "" && !imageToSend) return;
    if (loading || imageUploading || aiProcessing) return;

    try {
      const userMessage: ChatMessageType = { 
        role: 'user', 
        content: textToSend || "Kan du analysere dette bildet?",
        image: imageToSend || undefined,
        isVoice: !!messageText // If messageText is provided, it came from voice
      };
      
      // Clear input immediately to prevent double sends
      setInput("");
      setPendingImage(null);
      
      // Save user message to database
      await saveMessage({
        role: 'user',
        content: userMessage.content,
        image: userMessage.image,
        is_voice: userMessage.isVoice
      });

      // Convert messages to format expected by AI
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      messageHistory.push({
        role: userMessage.role,
        content: userMessage.content
      });

      setAiProcessing(true);
      const { reply, analysis, suggestedActions, actionData } = await sendMessage(messageHistory, imageToSend || undefined);

      // Store the latest actions for display
      setLatestActions({ suggestedActions, actionData });

      // Save AI response to database
      if (reply) {
        await saveMessage({
          role: 'assistant',
          content: reply,
          analysis: analysis || undefined,
          // Note: suggestedActions and actionData are not persisted to DB, 
          // they're only used for the current UI session
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleVoiceTranscription = (transcribedText: string) => {
    setInput(transcribedText);
  };

  const handleImageCapture = (capturedImage: string) => {
    setPendingImage(capturedImage);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    await clearSession();
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const showSuggestions = !loading && !sessionLoading && !aiProcessing;

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-white">
      {sessionLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img 
                  src={aiHelperImage} 
                  alt="AI Hyttehjelper" 
                  className="w-full h-full object-cover object-center scale-150"
                  style={{ filter: 'brightness(1.1) contrast(1.2)' }}
                />
              </div>
              {currentSession?.title || 'AI Hyttehjelper'}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="text-gray-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="text-gray-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-gray-50">
            {displayMessages.map((msg, index) => {
              // Show actions on the last assistant message if available
              const isLastAssistantMessage = index === displayMessages.length - 1 && msg.role === 'assistant';
              const shouldShowActions = isLastAssistantMessage && latestActions.suggestedActions;
              
              return (
                <ChatMessage
                  key={msg.id || index}
                  role={msg.role}
                  content={msg.content}
                  image={msg.image}
                  image_url={msg.image_url}
                  isVoice={msg.is_voice}
                  analysis={msg.analysis}
                  suggestedActions={shouldShowActions ? latestActions.suggestedActions : undefined}
                  actionData={shouldShowActions ? latestActions.actionData : undefined}
                />
              );
            })}
            
            {loading && <ChatMessage role="assistant" content="" isLoading={true} />}
            {aiProcessing && <LoadingIndicator message="AI analyserer bildet..." />}
            
            {showSuggestions && (
              <div className="mt-4">
                <PromptSuggestions 
                  onSuggestionClick={handleSuggestionClick}
                  className="bg-white/50 rounded-lg p-3 border border-gray-200/50"
                />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 bg-white border-t shadow-lg">
            {error && (
              <div className="text-red-500 text-center p-2 text-sm mb-3 bg-red-50 rounded border">
                {error}
              </div>
            )}
            
            {pendingImage && (
              <div className="mb-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border">
                <img src={pendingImage} alt="Pending" className="w-12 h-12 object-cover rounded border" />
                <span className="text-sm text-gray-700 flex-1">
                  {imageUploading ? "Laster opp bilde..." : "Bilde klart for sending"}
                </span>
                {imageUploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPendingImage(null)}
                  disabled={imageUploading}
                  className="text-xs"
                >
                  Fjern
                </Button>
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Skriv en melding... (Trykk Enter for å sende, Shift+Enter for ny linje)"
                  disabled={loading || aiProcessing}
                  className="resize-none pr-12 min-h-[48px] text-base leading-relaxed"
                  style={{ height: 'auto' }}
                />
                <Button 
                  type="submit" 
                  disabled={(!input.trim() && !pendingImage) || loading || imageUploading || aiProcessing}
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                >
                  {loading || imageUploading || aiProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
              
              <div className="flex justify-center gap-2">
                <VoiceRecordButton onTranscription={handleVoiceTranscription} disabled={loading || imageUploading || aiProcessing} />
                <ImageCaptureButton onImageCapture={handleImageCapture} disabled={loading || imageUploading || aiProcessing} />
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AiChat;