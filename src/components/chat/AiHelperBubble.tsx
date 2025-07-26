import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function AiHelperBubble() {
  return (
    <Link 
      to="/ai-helper"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
    >
      <Brain className="w-8 h-8 text-white" />
    </Link>
  );
}