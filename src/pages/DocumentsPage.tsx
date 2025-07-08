
import React from 'react';
import Header from '@/components/Header';
import DocumentsManager from '@/components/documents/DocumentsManager';

export default function DocumentsPage() {
  return (
    <main className="flex flex-col h-screen bg-gray-100">
      <Header title="Dokumenter" showBackButton={true} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-20">
        <div className="max-w-4xl mx-auto">
          <DocumentsManager />
        </div>
      </div>
    </main>
  );
}
