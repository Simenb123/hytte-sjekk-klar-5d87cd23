import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedToggleProps {
  value: '5' | '10';
  onChange: (value: '5' | '10') => void;
  disabled?: boolean;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1 h-9">
      <button
        type="button"
        onClick={() => onChange('5')}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          value === '5'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        )}
      >
        5 dager
      </button>
      <button
        type="button"
        onClick={() => onChange('10')}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          value === '10'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        )}
      >
        10 dager
      </button>
    </div>
  );
};