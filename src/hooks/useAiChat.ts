
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isVoice?: boolean;
};

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (messageHistory: ChatMessage[], image?: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: functionError } = await supabase.functions.invoke('ai-helper', {
        body: {
          history: messageHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          image
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined
      });

      if (functionError) throw functionError;
      
      if (data.error) throw new Error(data.error);

      return data.reply;
    } catch (err: any) {
      console.error("Error calling ai-helper function:", err);
      setError("Beklager, noe gikk galt. Vennligst prøv igjen. Hvis problemet vedvarer, kan det hende API-nøkkelen for OpenAI mangler.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}
