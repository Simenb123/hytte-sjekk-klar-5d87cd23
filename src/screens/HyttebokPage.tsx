import React, { useState } from 'react';
import Layout from '@/layout/Layout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiChat } from '@/hooks/useAiChat';
import { useHyttebokEntries, useAddHyttebokEntry } from '@/hooks/useHyttebok';
import { TestSecretsButton } from '@/components/calendar/TestSecretsButton';
export default function HyttebokPage() {
  const [text, setText] = useState('');
  const { sendMessage, loading } = useAiChat();
  const { data: entries = [], isLoading } = useHyttebokEntries();
  const addEntry = useAddHyttebokEntry();

  const handleSave = () => {
    if (!text.trim()) return;
    addEntry.mutate({ content: text.trim() }, { onSuccess: () => setText('') });
  };

  const handleSuggest = async () => {
    if (!text.trim()) return;
    const { reply } = await sendMessage([
      { role: 'user', content: `Forbedre teksten grammatisk og foreslå endringer: \n${text}` }
    ]);
    if (reply) setText(reply);
  };

  return (
    <Layout title="Hytteboka" showBackButton>
      <div className="w-full p-4 space-y-6">
        <TestSecretsButton />
        <div className="bg-white p-4 rounded-lg shadow">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Skriv et nytt innlegg..."
            rows={6}
          />
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSave} disabled={loading || !text.trim()}>
              Lagre innlegg
            </Button>
            <Button onClick={handleSuggest} variant="outline" disabled={loading || !text.trim()}>
              Få AI-forslag
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {isLoading && (
            <p className="text-center text-gray-500">Laster...</p>
          )}
          {entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
              <div className="text-xs text-gray-500 mb-2">
                {new Date(entry.created_at).toLocaleString('no-NO')}
              </div>
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-center text-gray-500">Ingen innlegg enda.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

