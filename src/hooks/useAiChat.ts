
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isVoice?: boolean;
  analysis?: string;
};

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    messageHistory: ChatMessage[],
    image?: string
  ): Promise<{ reply: string | null; analysis?: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let analysis: string | null = null;
      const historyWithAnalysis = [...messageHistory];
      if (image) {
        try {
          const { data: aiData, error: aiError } = await supabase.functions.invoke(
            'inventory-ai',
            {
              body: { image },
            }
          );
          if (aiError) {
            console.error('inventory-ai error:', aiError);
          } else if (aiData?.result) {
            const result = aiData.result;
            analysis = `${result.name}. ${result.description}`.trim();
            historyWithAnalysis.push({
              role: 'assistant',
              content: `Bildet viser: ${analysis}`,
            });
          }
        } catch (err) {
          console.error('Error analyzing image:', err);
        }
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        'ai-helper',
        {
          body: {
            history: historyWithAnalysis.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            image,
          },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }
      );

      if (functionError) throw functionError;

      if (data.error) throw new Error(data.error);

      return { reply: data.reply, analysis };
    } catch (err: unknown) {
      console.error('Error calling ai-helper function:', err);
      setError(
        'Beklager, noe gikk galt. Vennligst prøv igjen. Hvis problemet vedvarer, kan det hende API-nøkkelen for OpenAI mangler.'
      );
      return { reply: null, analysis: null };
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}
