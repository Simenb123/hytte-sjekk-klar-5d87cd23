
import { skiData } from "@/lib/ski-data";
import { useBulkAddInventoryItems } from "@/hooks/useInventory/index";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useState, useEffect } from "react";

export function SkiImportButton() {
    const [imported, setImported] = useState(false);
    const bulkAddMutation = useBulkAddInventoryItems();

    useEffect(() => {
        if (localStorage.getItem('ski_imported') === 'true') {
            setImported(true);
        }
    }, []);

    const handleImport = async () => {
        try {
            await bulkAddMutation.mutateAsync(skiData);
            toast.success("Skiutstyr importert!");
            localStorage.setItem('ski_imported', 'true');
            setImported(true);
        } catch (error) {
            const err = error as Error;
            toast.error(`Feil ved import: ${err.message}`);
        }
    };

    if (imported) {
        return null;
    }

    return (
        <Button onClick={handleImport} disabled={bulkAddMutation.isPending} variant="outline">
            {bulkAddMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importer skiutstyr
        </Button>
    );
}
