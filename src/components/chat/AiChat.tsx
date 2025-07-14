
import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Trash2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import VoiceRecordButton from "./VoiceRecordButton";
import ImageCaptureButton from "./ImageCaptureButton";
import { useAiChat, ChatMessage as ChatMessageType } from "@/hooks/useAiChat";

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const { sendMessage, loading, error } = useAiChat();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hei! Jeg er din personlige hyttehjelper. Du kan spørre meg med tekst, lyd eller bilder om hva som helst som har med hytta å gjøre! Prøv for eksempel:\n\n• Ta et bilde av en gjenstand for identifikasjon\n• Spør med stemmen din mens du har hendene opptatt\n• Be om hjelp med vedlikehold eller problemer',
      },
    ]);
  }, []);

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
    if (loading) return;

    const userMessage: ChatMessageType = { 
      role: 'user', 
      content: textToSend || "Kan du se på dette bildet?",
      image: imageToSend || undefined,
      isVoice: !!messageText // If messageText is provided, it came from voice
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setPendingImage(null);

    const { reply, analysis } = await sendMessage(newMessages, imageToSend || undefined);

    setMessages((prev) => {
      const updated = [...prev];
      if (analysis) {
        const lastIndex = updated.length - 1;
        updated[lastIndex] = { ...updated[lastIndex], analysis };
      }
      if (reply) {
        updated.push({ role: 'assistant', content: reply });
      }
      return updated;
    });
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

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hei! Jeg er din personlige hyttehjelper. Du kan spørre meg med tekst, lyd eller bilder om hva som helst som har med hytta å gjøre!',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-white">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
          <span role="img" aria-label="ape">🙉</span>
          AI Hyttehjelper
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="text-gray-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            role={msg.role}
            content={msg.content}
            image={msg.image}
            isVoice={msg.isVoice}
            analysis={msg.analysis}
          />
        ))}
        {loading && <ChatMessage role="assistant" content="" isLoading={true} />}
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
            <span className="text-sm text-gray-700 flex-1">Bilde klart for sending</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPendingImage(null)}
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
              disabled={loading}
              className="resize-none pr-12 min-h-[48px] text-base leading-relaxed"
              style={{ height: 'auto' }}
            />
            <Button 
              type="submit" 
              disabled={loading || (!input.trim() && !pendingImage)}
              size="sm"
              className="absolute bottom-2 right-2 h-8 w-8 p-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
          
          <div className="flex justify-center gap-2">
            <VoiceRecordButton 
              onTranscription={handleVoiceTranscription}
              disabled={loading}
            />
            
            <ImageCaptureButton 
              onImageCapture={handleImageCapture}
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
