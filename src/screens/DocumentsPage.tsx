
import React from 'react';
import Layout from '@/layout/Layout';
import DocumentsManager from '@/components/documents/DocumentsManager';

export default function DocumentsPage() {
  return (
    <Layout title="Dokumenter" showBackButton>
      <div className="container mx-auto flex-1 overflow-y-auto p-4 md:p-6">
        <DocumentsManager />
      </div>
    </Layout>
  );
}
