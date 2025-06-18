
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
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

    const aiResponse = await sendMessage(newMessages, imageToSend || undefined);
    
    if (aiResponse) {
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
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
        <h2 className="text-lg font-semibold text-gray-800">AI Hyttehjelper</h2>
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
          />
        ))}
        {loading && <ChatMessage role="assistant" content="" isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-white border-t shadow-lg">
        {error && (
          <div className="text-red-500 text-center p-2 text-sm mb-2 bg-red-50 rounded border">
            {error}
          </div>
        )}
        
        {pendingImage && (
          <div className="mb-3 flex items-center gap-3 p-2 bg-blue-50 rounded border">
            <img src={pendingImage} alt="Pending" className="w-12 h-12 object-cover rounded border" />
            <span className="text-sm text-gray-700 flex-1">Bilde klart for sending</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPendingImage(null)}
            >
              Fjern
            </Button>
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Still et spørsmål..."
              disabled={loading}
              autoComplete="off"
              className="text-base"
            />
          </div>
          
          <div className="flex gap-1">
            <VoiceRecordButton 
              onTranscription={handleVoiceTranscription}
              disabled={loading}
            />
            
            <ImageCaptureButton 
              onImageCapture={handleImageCapture}
              disabled={loading}
            />
            
            <Button 
              type="submit" 
              disabled={loading || (!input.trim() && !pendingImage)}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
