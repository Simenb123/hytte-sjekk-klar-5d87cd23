
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from '@/layout/AppErrorBoundary';
import './index.css';

// Wrap the app in a try-catch to capture any initialization errors
try {
  console.log('[main] Initializing application');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Could not find root element');
  }
  
  const root = createRoot(rootElement);
  root.render(
    // Temporarily remove StrictMode to eliminate double-mounting issues during debugging
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
  
  console.log('[main] Application initialized successfully');
} catch (error) {
  console.error('[main] Error initializing application:', error);
}
