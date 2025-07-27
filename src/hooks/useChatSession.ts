import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { uploadImageToStorage, base64ToFile, compressImage } from '@/utils/imageUtils';

export interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  image_url?: string;
  is_voice?: boolean;
  analysis?: string;
  suggested_actions?: Array<{
    type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
    label: string;
    confidence: number;
    reason: string;
  }>;
  action_data?: any;
  created_at: string;
}

export function useChatSession() {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load or create current session
  useEffect(() => {
    if (!user) return;

    const loadCurrentSession = async () => {
      setLoading(true);
      try {
        // Try to get the most recent session
        const { data: sessions, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (sessionError) throw sessionError;

        if (sessions && sessions.length > 0) {
          setCurrentSession(sessions[0]);
          await loadMessages(sessions[0].id);
        } else {
          // Create a new session if none exists
          await createNewSession();
        }
      } catch (err: any) {
        console.error('Error loading chat session:', err);
        setError('Kunne ikke laste chat-historikk');
        toast.error('Kunne ikke laste chat-historikk');
      } finally {
        setLoading(false);
      }
    };

    loadCurrentSession();
  }, [user]);

  const loadMessages = async (sessionId: string, limit = 15, offset = 0) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (messagesError) throw messagesError;

      const sortedData = (messagesData || []).reverse().map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        suggested_actions: msg.suggested_actions as Array<{
          type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
          label: string;
          confidence: number;
          reason: string;
        }> | undefined,
        action_data: msg.action_data
      }));
      
      if (offset === 0) {
        setMessages(sortedData);
      } else {
        setMessages(prev => [...sortedData, ...prev]);
      }
      
      return sortedData.length === limit; // Return true if there might be more messages
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError('Kunne ikke laste meldinger');
      return false;
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'Ny samtale'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setCurrentSession(sessionData);
      setMessages([]);
      setError(null);
      
      return sessionData;
    } catch (err: any) {
      console.error('Error creating new session:', err);
      setError('Kunne ikke opprette ny samtale');
      toast.error('Kunne ikke opprette ny samtale');
    }
  };

  const saveMessage = async (messageData: {
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    is_voice?: boolean;
    analysis?: string;
    suggested_actions?: Array<{
      type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
      label: string;
      confidence: number;
      reason: string;
    }>;
    action_data?: any;
  }) => {
    if (!currentSession || !user) return;

    try {
      let imageUrl: string | undefined;
      
      // If there's a base64 image, upload it to storage
      if (messageData.image && messageData.image.startsWith('data:')) {
        try {
          const file = base64ToFile(messageData.image);
          const compressedFile = await compressImage(file);
          imageUrl = await uploadImageToStorage(compressedFile, user.id);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Kunne ikke laste opp bilde');
        }
      }

      const { data: messageResult, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          role: messageData.role,
          content: messageData.content,
          image_url: imageUrl,
          // Keep base64 for compatibility (temporary)
          image: messageData.image,
          is_voice: messageData.is_voice,
          analysis: messageData.analysis,
          suggested_actions: messageData.suggested_actions,
          action_data: messageData.action_data
        })
        .select()
        .single();

      if (messageError) throw messageError;

      setMessages(prev => [...prev, {
        ...messageResult,
        role: messageResult.role as 'user' | 'assistant',
        suggested_actions: messageResult.suggested_actions as Array<{
          type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
          label: string;
          confidence: number;
          reason: string;
        }> | undefined,
        action_data: messageResult.action_data
      }]);

      // Auto-update session title based on first user message
      if (messageData.role === 'user' && currentSession?.title === 'Ny samtale') {
        const title = messageData.content.slice(0, 50) + (messageData.content.length > 50 ? '...' : '');
        await updateSessionTitle(title);
      }
      
      return messageResult;
    } catch (err: any) {
      console.error('Error saving message:', err);
      setError('Kunne ikke lagre melding');
      toast.error('Kunne ikke lagre melding');
    }
  };

  const loadMoreMessages = async () => {
    if (!currentSession) return false;
    
    return await loadMessages(currentSession.id, 20, messages.length);
  };

  const updateSessionTitle = async (title: string) => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(prev => prev ? { ...prev, title } : null);
    } catch (err: any) {
      console.error('Error updating session title:', err);
    }
  };

  const clearSession = async () => {
    await createNewSession();
  };

  return {
    currentSession,
    messages,
    loading,
    error,
    saveMessage,
    createNewSession,
    clearSession,
    updateSessionTitle,
    loadMoreMessages
  };
}