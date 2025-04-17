
import React from 'react';
import Header from '../components/Header';
import CompletionLogList from '../components/logs/CompletionLogList';

const LogsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Sjekkliste-logger"
        showBackButton={true}
        showHomeButton={true}
      />
      
      <div className="max-w-4xl mx-auto p-4 pt-28">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">Fullførte sjekkpunkter</h2>
          <CompletionLogList />
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
