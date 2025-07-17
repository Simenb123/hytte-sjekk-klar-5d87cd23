
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Calendar } from 'lucide-react';
import { useBookingReminders } from '@/hooks/useBookingReminders';

const ReminderTestButton: React.FC = () => {
  const { 
    triggerReminderCheck, 
    triggerDailyReminders,
    isProcessing, 
    isDailyProcessing 
  } = useBookingReminders();

  const handleTrigger3Day = async () => {
    await triggerReminderCheck();
  };

  const handleTriggerDaily = async () => {
    await triggerDailyReminders();
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleTrigger3Day} 
        disabled={isProcessing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        {isProcessing ? 'Sjekker...' : 'Test 3-dagers'}
      </Button>
      
      <Button 
        onClick={handleTriggerDaily} 
        disabled={isDailyProcessing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        {isDailyProcessing ? 'Sjekker...' : 'Test daglige'}
      </Button>
    </div>
  );
};

export default ReminderTestButton;
