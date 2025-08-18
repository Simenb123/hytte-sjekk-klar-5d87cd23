
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isVoice?: boolean;
  analysis?: string;
  suggestedActions?: Array<{
    type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
    label: string;
    confidence: number;
    reason: string;
  }>;
  actionData?: any;
};

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    messageHistory: ChatMessage[],
    image?: string
  ): Promise<{ 
    reply: string | null; 
    analysis?: string | null;
    suggestedActions?: Array<{
      type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
      label: string;
      confidence: number;
      reason: string;
    }>;
    actionData?: any;
  }> => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let analysis: string | null = null;
      let suggestedActions: any[] = [];
      let actionData: any = null;
      
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
            suggestedActions = result.suggestedActions || [];
            actionData = result; // Store the full result for action buttons
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

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw functionError;
      }

      if (data.error) {
        console.error('AI helper returned error:', data.error, data.details);
        throw new Error(data.error);
      }

      if (!data.reply) {
        console.error('AI helper returned no reply:', data);
        throw new Error('AI-hjelperen ga ikke noe svar. Prøv igjen.');
      }

      // Merge image-based actions with contextual actions from AI helper
      const allSuggestedActions = [
        ...(suggestedActions || []),
        ...(data.suggestedActions || [])
      ];

      // Use actionData from AI helper if available, otherwise use the inventory analysis
      // Include the image data if available
      const finalActionData = data.actionData || (actionData ? { ...actionData, originalImage: image } : null);

      return { 
        reply: data.reply, 
        analysis, 
        suggestedActions: allSuggestedActions.length > 0 ? allSuggestedActions : undefined, 
        actionData: finalActionData 
      };
    } catch (err: unknown) {
      console.error('Error calling ai-helper function:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil';
      console.error('Error details:', errorMessage);
      
      setError(
        `AI-hjelperen svarte ikke: ${errorMessage}. Prøv igjen eller kontakt support hvis problemet vedvarer.`
      );
      return { reply: null, analysis: null, suggestedActions: [], actionData: null };
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}
