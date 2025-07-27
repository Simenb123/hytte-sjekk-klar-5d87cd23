import React from 'react';
import ActionButton from './ActionButton';

interface SuggestedAction {
  type: 'inventory' | 'documents' | 'wine' | 'hyttebok' | 'checklist';
  label: string;
  confidence: number;
  reason: string;
}

interface ActionSuggestionsProps {
  actions: SuggestedAction[];
  data?: any;
  onActionTaken?: () => void;
}

const ActionSuggestions: React.FC<ActionSuggestionsProps> = ({ 
  actions, 
  data, 
  onActionTaken 
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Foreslåtte handlinger:
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            type={action.type}
            label={action.label}
            data={data}
            onAction={onActionTaken}
          />
        ))}
      </div>
    </div>
  );
};

export default ActionSuggestions;