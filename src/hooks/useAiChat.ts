
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (prompt: string, messageHistory: ChatMessage[]): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-helper', {
        body: { prompt, history: messageHistory },
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

