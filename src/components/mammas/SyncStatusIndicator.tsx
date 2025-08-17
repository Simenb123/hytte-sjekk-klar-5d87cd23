import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  isConnected: boolean;
  isOnline: boolean;
  lastSyncTime?: string;
  syncError?: string | null;
  isLoading?: boolean;
  className?: string;
}

export function SyncStatusIndicator({
  isConnected,
  isOnline,
  lastSyncTime,
  syncError,
  isLoading = false,
  className
}: SyncStatusIndicatorProps) {
  const getStatusColor = () => {
    if (!isOnline) return 'text-destructive';
    if (syncError) return 'text-destructive';
    if (!isConnected) return 'text-warning';
    if (isLoading) return 'text-primary';
    return 'text-success';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (syncError) return <AlertTriangle className="w-4 h-4" />;
    if (isLoading) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (isConnected) return <CheckCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Frakoblet';
    if (syncError) return 'Synkroniseringsfeil';
    if (!isConnected) return 'Kalender frakoblet';
    if (isLoading) return 'Synkroniserer...';
    return 'Tilkoblet';
  };

  const formatLastSync = (timeString?: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return 'Akkurat nå';
      if (diffMinutes < 60) return `${diffMinutes}m siden`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}t siden`;
      return date.toLocaleDateString('nb-NO', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      getStatusColor(),
      className
    )}>
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className="font-medium">{getStatusText()}</span>
        {lastSyncTime && isConnected && !syncError && (
          <span className="text-xs opacity-70">
            Sist oppdatert: {formatLastSync(lastSyncTime)}
          </span>
        )}
      </div>
    </div>
  );
}