
import React from 'react';
import Layout from '@/layout/Layout';
import CompletionLogList from '../components/checklistLogs/CompletionLogList';
import { FileText } from 'lucide-react';

const LogsPage = () => {
  return (
    <Layout title="Sjekkliste-logger" showBackButton showHomeButton>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-6 w-6 text-purple-500" />
            <h2 className="text-2xl font-semibold">Fullførte sjekkpunkter</h2>
          </div>
          <CompletionLogList />
        </div>
      </div>
    </Layout>
  );
};

export default LogsPage;
