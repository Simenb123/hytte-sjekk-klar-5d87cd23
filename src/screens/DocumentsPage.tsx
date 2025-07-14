
import React from 'react';
import Layout from '@/layout/Layout';
import DocumentsManager from '@/components/documents/DocumentsManager';

export default function DocumentsPage() {
  return (
    <Layout title="Dokumenter" showBackButton>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="w-full">
          <DocumentsManager />
        </div>
      </div>
    </Layout>
  );
}
