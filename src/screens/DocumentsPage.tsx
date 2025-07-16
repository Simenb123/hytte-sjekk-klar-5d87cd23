
import React from 'react';
import Layout from '@/layout/Layout';
import DocumentsManager from '@/components/documents/DocumentsManager';

export default function DocumentsPage() {
  return (
    <Layout title="Dokumenter" showBackButton>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <DocumentsManager />
      </div>
    </Layout>
  );
}
