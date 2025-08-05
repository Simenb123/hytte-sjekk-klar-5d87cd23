import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Trash2, History, FileText } from 'lucide-react';
import { useBookingChecklistActions, useBookingChecklistStatus, useBookingChecklistHistory } from '@/hooks/useBookingChecklist';
import type { ChecklistCategory } from '@/models/checklist';
import type { AreaWithItems } from '@/types/database.types';
import type { CategoryCompletionData } from '@/services/bookingChecklist.service';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface BookingChecklistActionsProps {
  bookingId: string;
  category: ChecklistCategory;
  areasData: AreaWithItems[];
  categoryDisplayName: string;
}

const BookingChecklistActions: React.FC<BookingChecklistActionsProps> = ({
  bookingId,
  category,
  areasData,
  categoryDisplayName,
}) => {
  const [notes, setNotes] = useState('');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  const { completeCategoryForBooking, deleteCompletion, loading } = useBookingChecklistActions();
  const { data: statusMap } = useBookingChecklistStatus(bookingId);
  const { data: history } = useBookingChecklistHistory(bookingId);
  
  const isCompleted = !!(statusMap && statusMap[category]);
  const categoryHistory = history?.filter(h => h.category === category) || [];

  const handleCompleteCategory = async () => {
    // Prepare completion data from current areas
    const allItems = areasData.flatMap(area => area.items);
    const completedItems = allItems.filter(item => item.isCompleted);
    
    const completionData: CategoryCompletionData = {
      items: allItems.map(item => ({
        id: item.id,
        text: item.text,
        isCompleted: item.isCompleted,
        completedBy: item.completedBy,
      })),
      totalItems: allItems.length,
      completedItems: completedItems.length,
      completedBy: 'Current User', // TODO: Get actual user name
    };

    const success = await completeCategoryForBooking(
      bookingId,
      category,
      completionData,
      notes
    );

    if (success) {
      setShowCompleteDialog(false);
      setNotes('');
    }
  };

  const handleDeleteCompletion = async () => {
    await deleteCompletion(bookingId, category);
  };

  return (
    <div className="flex gap-2 mb-4">
      {!isCompleted ? (
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Fullfør {categoryDisplayName}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fullfør sjekkliste: {categoryDisplayName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Dette vil markere hele kategorien som fullført for denne bookingen.
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Status:</strong> {areasData.reduce((acc, area) => acc + area.items.filter(i => i.isCompleted).length, 0)} av {areasData.reduce((acc, area) => acc + area.items.length, 0)} punkter fullført
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notater (valgfritt)</Label>
                <Textarea
                  id="notes"
                  placeholder="Legg til notater for denne fullføringen..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteDialog(false)}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleCompleteCategory}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {loading ? 'Fullfører...' : 'Fullfør kategori'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Fullført</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteCompletion}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Fjern fullføring
          </Button>
        </div>
      )}

      {categoryHistory.length > 0 && (
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historikk ({categoryHistory.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Historikk for {categoryDisplayName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {categoryHistory.map((completion) => (
                <div key={completion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Fullført</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(completion.completed_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                    </span>
                  </div>
                  
                  {completion.completion_data?.completedItems && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {completion.completion_data.completedItems} av {completion.completion_data.totalItems} punkter fullført
                    </p>
                  )}
                  
                  {completion.notes && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3" />
                        <span className="font-medium">Notater:</span>
                      </div>
                      <p>{completion.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BookingChecklistActions;