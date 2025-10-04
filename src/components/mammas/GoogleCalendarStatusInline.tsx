import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { useGoogleCalendarHealth } from '@/hooks/useGoogleCalendarHealth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GoogleCalendarStatusInlineProps {
  onReconnect?: () => void;
}

export const GoogleCalendarStatusInline = ({ onReconnect }: GoogleCalendarStatusInlineProps) => {
  const { isGoogleConnected } = useGoogleCalendar();
  const { isHealthy, lastHealthCheck, performHealthCheck } = useGoogleCalendarHealth();

  const getStatusColor = () => {
    if (!isGoogleConnected) return 'bg-muted text-muted-foreground';
    if (isHealthy) return 'bg-success/20 text-success border-success/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  const getStatusIcon = () => {
    if (!isGoogleConnected) return <AlertCircle className="h-4 w-4" />;
    if (isHealthy) return <CheckCircle2 className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isGoogleConnected) return 'Ikke tilkoblet';
    if (isHealthy) return 'Tilkoblet og fungerer';
    return 'Tilkoblet med problemer';
  };

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusColor()}`}>
        {getStatusIcon()}
        <div className="flex-1">
          <div className="text-sm font-medium">{getStatusText()}</div>
          {lastHealthCheck && (
            <div className="text-xs opacity-70">
              Sist sjekket: {new Date(lastHealthCheck).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => performHealthCheck()}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {!isHealthy && isGoogleConnected && onReconnect && (
        <Button
          onClick={onReconnect}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Prøv å gjenopprette tilkobling
        </Button>
      )}
    </div>
  );
};
