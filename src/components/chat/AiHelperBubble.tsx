import React from 'react';
import { Link } from 'react-router-dom';
import aiHelperImage from '@/assets/lovable-uploads/e5ff44d2-e8ee-4312-925b-75026c32e7f6.png';

export default function AiHelperBubble() {
  return (
    <Link 
      to="/ai-helper"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 overflow-hidden"
    >
      <img 
        src={aiHelperImage} 
        alt="AI Hyttehjelper" 
        className="w-full h-full object-cover"
      />
    </Link>
  );
}