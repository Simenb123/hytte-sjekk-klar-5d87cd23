
import { Button } from '@/components/ui/button';
import { useBulkAddInventoryItems } from '@/hooks/useInventory/index';
import { inventoryDataToImport } from '@/lib/inventoryData';
import { toast } from 'sonner';
import { Loader2, FileUp } from 'lucide-react';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const BulkImportButton = () => {
    const bulkAddMutation = useBulkAddInventoryItems();
    const [open, setOpen] = useState(false);

    const handleImport = () => {
        toast.promise(bulkAddMutation.mutateAsync(inventoryDataToImport), {
            loading: 'Importerer gjenstander...',
            success: () => {
                setOpen(false);
                return 'Alle gjenstander er importert!';
            },
            error: (err) => {
                setOpen(false);
                return `Noe gikk galt: ${err.message}`;
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Importer liste
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Dette vil legge til {inventoryDataToImport.length} nye gjenstander i inventarlisten din. 
                        Denne handlingen kan ikke angres.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={bulkAddMutation.isPending}>Avbryt</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImport} disabled={bulkAddMutation.isPending}>
                         {bulkAddMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ja, importer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
