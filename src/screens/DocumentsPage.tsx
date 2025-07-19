
import React from 'react';
import Layout from '@/layout/Layout';
import DocumentsManager from '@/components/documents/DocumentsManager';

export default function DocumentsPage() {
  return (
    <Layout title="Dokumenter" showBackButton>
      <div className="w-full h-full">
        <div className="container mx-auto px-4 py-6 max-w-4xl h-full">
          <DocumentsManager />
        </div>
      </div>
    </Layout>
  );
}
