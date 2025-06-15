
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useAiChat, ChatMessage as ChatMessageType } from "@/hooks/useAiChat";

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
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
        content: 'Hei! Jeg er din personlige hyttehjelper. Spør meg om hva som helst som har med hytta å gjøre!',
      },
    ]);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || loading) return;

    const userMessage: ChatMessageType = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    const aiResponse = await sendMessage(newMessages);
    
    if (aiResponse) {
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}
        {loading && <ChatMessage role="assistant" content="" isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-white border-t">
        {error && <div className="text-red-500 text-center p-2 text-sm mb-2">{error}</div>}
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Still et spørsmål..."
            disabled={loading}
            autoComplete="off"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
