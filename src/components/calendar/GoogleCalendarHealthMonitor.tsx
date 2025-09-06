import React, { useEffect } from 'react';
import { useGoogleCalendarHealth } from '@/hooks/useGoogleCalendarHealth';
import { useGoogleCalendar } from '@/contexts/GoogleCalendarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleCalendarHealthMonitorProps {
  showDebugInfo?: boolean;
}

export function GoogleCalendarHealthMonitor({ showDebugInfo = false }: GoogleCalendarHealthMonitorProps) {
  const { isGoogleConnected, connectionError, fetchError } = useGoogleCalendar();
  const {
    isHealthy,
    lastHealthCheck,
    consecutiveFailures,
    isMonitoring,
    lastError,
    triggerRecovery,
    performHealthCheck,
    isRecoveryNeeded
  } = useGoogleCalendarHealth();

  // Show critical health issues
  useEffect(() => {
    if (isRecoveryNeeded && !isHealthy) {
      toast.error(
        'Google Calendar har vært utilgjengelig en stund. Automatisk gjenoppretting pågår.',
        { duration: 10000 }
      );
    }
  }, [isRecoveryNeeded, isHealthy]);

  const handleManualRecovery = async () => {
    toast.info('Starter manuell gjenoppretting av Google Calendar...');
    const success = await triggerRecovery();
    
    if (!success) {
      toast.error('Manuell gjenoppretting feilet. Prøv å koble til på nytt.');
    }
  };

  const handleHealthCheck = async () => {
    toast.info('Utfører helsesjekk...');
    const healthy = await performHealthCheck();
    
    if (healthy) {
      toast.success('Google Calendar er frisk og tilgjengelig');
    } else {
      toast.warning('Google Calendar har problemer. Automatisk gjenoppretting vil bli forsøkt.');
    }
  };

  if (!showDebugInfo && isHealthy && isGoogleConnected) {
    return null; // Hide when everything is working
  }

  const getStatusColor = () => {
    if (!isGoogleConnected) return 'destructive';
    if (!isHealthy || consecutiveFailures > 0) return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!isGoogleConnected) return <WifiOff className="h-4 w-4" />;
    if (!isHealthy) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isGoogleConnected) return 'Ikke tilkoblet';
    if (!isHealthy) return 'Utilgjengelig';
    return 'Frisk';
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="h-5 w-5" />
          Google Calendar Status
          <Badge variant={getStatusColor()} className="ml-auto">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tilkoblet:</span>
            <span className={isGoogleConnected ? 'text-green-600' : 'text-red-600'}>
              {isGoogleConnected ? 'Ja' : 'Nei'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Overvåking aktiv:</span>
            <span className={isMonitoring ? 'text-green-600' : 'text-gray-500'}>
              {isMonitoring ? 'Ja' : 'Nei'}
            </span>
          </div>
          
          {lastHealthCheck && (
            <div className="flex justify-between text-sm">
              <span>Siste sjekk:</span>
              <span>{lastHealthCheck.toLocaleTimeString('no-NO')}</span>
            </div>
          )}
          
          {consecutiveFailures > 0 && (
            <div className="flex justify-between text-sm">
              <span>Påfølgende feil:</span>
              <span className="text-red-600">{consecutiveFailures}</span>
            </div>
          )}
        </div>

        {/* Error Information */}
        {(connectionError || fetchError || lastError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Siste feil:</p>
            <p className="text-sm text-red-600 mt-1">
              {connectionError || fetchError || lastError}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleHealthCheck}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Sjekk status
          </Button>
          
          {(!isHealthy || !isGoogleConnected) && (
            <Button
              variant="default"
              size="sm"
              onClick={handleManualRecovery}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Gjenopprett
            </Button>
          )}
        </div>

        {/* Debug Information */}
        {showDebugInfo && (
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-medium">Debug informasjon</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify({
                isGoogleConnected,
                isHealthy,
                consecutiveFailures,
                isMonitoring,
                lastHealthCheck: lastHealthCheck?.toISOString(),
                connectionError: !!connectionError,
                fetchError: !!fetchError,
                lastError: !!lastError,
                isRecoveryNeeded
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}