import React from 'react';
import { useSkisporet } from '@/hooks/useSkisporet';

const SkisporetCard: React.FC = () => {
  const { data } = useSkisporet();

  let message = 'Ingen nye spor siste døgn ⚪';
  if (data?.updated) {
    const updated = new Date(data.updated);
    if (Date.now() - updated.getTime() < 24 * 60 * 60 * 1000) {
      const time = updated.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
      message = `Spor kjørt: 🟢 ${time}`;
    }
  }

  return (
    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-2">Skisporet</h2>
      <p>{message}</p>
    </div>
  );
};

export default SkisporetCard;
