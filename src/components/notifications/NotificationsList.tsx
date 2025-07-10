
import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const NotificationsList: React.FC = () => {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Laster notifikasjoner...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifikasjoner</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Marker alle som lest
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Ingen notifikasjoner
        </div>
      ) : (
        <ScrollArea className="h-96">
          {notifications.map((notification, index) => (
            <div key={notification.id}>
              <div
                className={cn(
                  "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-blue-50/50"
                )}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-sm font-medium",
                        !notification.read && "font-semibold"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(notification.createdAt, 'dd.MM.yyyy HH:mm', { locale: nb })}
                    </p>
                  </div>
                </div>
              </div>
              {index < notifications.length - 1 && <Separator />}
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
};

export default NotificationsList;
