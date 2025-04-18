
import React from 'react';
import Header from '../components/Header';
import CompletionLogList from '../components/logs/CompletionLogList';
import LogsDebug from '../components/logs/LogsDebug';
import { ClipboardList } from 'lucide-react';

const LogsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Sjekkliste-logger"
        showBackButton={true}
        showHomeButton={true}
      />
      
      <div className="max-w-4xl mx-auto p-4 pt-28">
        <LogsDebug />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-semibold">Fullførte sjekkpunkter</h2>
          </div>
          <CompletionLogList />
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
