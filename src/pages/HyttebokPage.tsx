import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiChat } from '@/hooks/useAiChat';
// Simple ID generator since uuid package may not be available
const generateId = () => Math.random().toString(36).substring(2, 10);

interface Entry {
  id: string;
  text: string;
  date: string;
}

export default function HyttebokPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');
  const { sendMessage, loading } = useAiChat();

  useEffect(() => {
    const stored = localStorage.getItem('hyttebokEntries');
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  const saveEntries = (updated: Entry[]) => {
    setEntries(updated);
    localStorage.setItem('hyttebokEntries', JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!text.trim()) return;
    const newEntry = { id: generateId(), text: text.trim(), date: new Date().toISOString() };
    const updated = [newEntry, ...entries];
    saveEntries(updated);
    setText('');
  };

  const handleSuggest = async () => {
    if (!text.trim()) return;
    const { reply } = await sendMessage([
      { role: 'user', content: `Forbedre teksten grammatisk og foreslå endringer: \n${text}` }
    ]);
    if (reply) setText(reply);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header title="Hytteboka" showBackButton={true} />
      <div className="max-w-2xl mx-auto p-4 pt-20 space-y-6">
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
          {entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
              <div className="text-xs text-gray-500 mb-2">
                {new Date(entry.date).toLocaleString('no-NO')}
              </div>
              <p className="whitespace-pre-wrap">{entry.text}</p>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-center text-gray-500">Ingen innlegg enda.</p>
          )}
        </div>
      </div>
    </main>
  );
}

