
import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import ChecklistContent from '../components/checklist/ChecklistContent';
import ChecklistLoading from '../components/checklist/ChecklistLoading';
import ChecklistError from '../components/checklist/ChecklistError';
import { useChecklistNavigation } from '../hooks/useChecklistNavigation';
import { useChecklistData } from '../hooks/useChecklistData';

const ChecklistApp = () => {
  const { error, isLoading } = useChecklistData();
  const { handleBack, getHeaderTitle, showBackButton } = useChecklistNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={getHeaderTitle()} 
        showBackButton={showBackButton}
        showHomeButton={true}
        onBackClick={handleBack}
      />
      
      <div className="max-w-lg mx-auto p-4 pt-28 relative z-20">
        <div className="bg-gray-50 relative z-20">
          {error ? (
            <ChecklistError error={error} />
          ) : isLoading ? (
            <ChecklistLoading />
          ) : (
            <ChecklistContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistApp;
