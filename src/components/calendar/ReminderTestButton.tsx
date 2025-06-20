
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useBookingReminders } from '@/hooks/useBookingReminders';

const ReminderTestButton: React.FC = () => {
  const { triggerReminderCheck, isProcessing } = useBookingReminders();

  const handleTrigger = async () => {
    await triggerReminderCheck();
  };

  return (
    <Button 
      onClick={handleTrigger} 
      disabled={isProcessing}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      {isProcessing ? 'Sjekker...' : 'Test påminnelser'}
    </Button>
  );
};

export default ReminderTestButton;
