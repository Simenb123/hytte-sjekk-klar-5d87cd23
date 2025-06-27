import React from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompletionLogs } from '@/services/logs.service';

const CompletionLogList: React.FC = () => {
  const { data: logs = [], isLoading, error } = useCompletionLogs();

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Laster logger...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Kunne ikke hente logger
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Ingen logger funnet.
      </div>
    );
  }

  const formatName = (first?: string | null, last?: string | null) =>
    `${first ?? ''} ${last ?? ''}`.trim() || 'Ukjent';

  return (
    <ScrollArea className="h-96">
      <ul className="divide-y divide-gray-200">
        {logs.map((log) => (
          <li key={log.id} className="py-2 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {log.checklist_items?.text ?? 'Ukjent punkt'}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(log.completed_at), 'dd.MM.yyyy HH:mm', {
                  locale: nb,
                })}{' '}
                – {formatName(log.profiles?.first_name, log.profiles?.last_name)}
              </p>
            </div>
            {log.is_completed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default CompletionLogList;
