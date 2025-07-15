import React, { useState, useRef } from 'react';
import { Download, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWineCellar } from '@/hooks/useWineCellar';
import { toast } from '@/components/ui/use-toast';
import type { WineCellarItem } from '@/types/wine';

interface WineImportExportProps {
  wines: WineCellarItem[];
}

export function WineImportExport({ wines }: WineImportExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addWine } = useWineCellar();

  const exportToCSV = () => {
    const headers = [
      'Navn',
      'Årgang',
      'Produsent',
      'Druesort',
      'Vintype',
      'Alkohol %',
      'Antall flasker',
      'Lokasjon',
      'Innkjøpspris',
      'Nåværende pris',
      'Innkjøpsdato',
      'Rating',
      'Smaksnotater',
      'Serveringsnotater',
      'Land',
      'Region',
      'Drukket',
      'Drukket dato',
      'Drukket med'
    ];

    const csvData = wines.map(wine => [
      wine.name,
      wine.vintage || '',
      wine.producer || '',
      wine.grape_variety || '',
      wine.wine_color || '',
      wine.alcohol_percentage || '',
      wine.bottle_count,
      wine.location,
      wine.purchase_price || '',
      wine.current_price || '',
      wine.purchase_date || '',
      wine.rating || '',
      wine.tasting_notes || '',
      wine.serving_notes || '',
      wine.country || '',
      wine.region || '',
      wine.is_consumed ? 'Ja' : 'Nei',
      wine.consumed_date || '',
      wine.consumed_with || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vinlager_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Vinlager eksportert!', description: 'CSV-fil lastet ned' });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const values = line.split(',').map(v => v.replace(/"/g, ''));
            const wine: Partial<WineCellarItem> = {
              name: values[0] || '',
              vintage: values[1] || undefined,
              producer: values[2] || undefined,
              grape_variety: values[3] || undefined,
              wine_color: (values[4] && ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified'].includes(values[4]) ? values[4] : undefined) as 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified' | undefined,
              alcohol_percentage: values[5] ? Number(values[5]) : undefined,
              bottle_count: Number(values[6]) || 1,
              location: values[7] || 'Hjemme',
              purchase_price: values[8] ? Number(values[8]) : undefined,
              current_price: values[9] ? Number(values[9]) : undefined,
              purchase_date: values[10] || undefined,
              rating: values[11] ? Number(values[11]) : undefined,
              tasting_notes: values[12] || undefined,
              serving_notes: values[13] || undefined,
              country: values[14] || undefined,
              region: values[15] || undefined,
              is_consumed: values[16] === 'Ja',
              consumed_date: values[17] || undefined,
              consumed_with: values[18] || undefined,
            };

            if (wine.name) {
              addWine(wine);
              successCount++;
            }
          } catch (error) {
            errorCount++;
            console.error('Error importing wine row:', error);
          }
        }

        toast({ 
          title: 'Import fullført!', 
          description: `${successCount} viner importert${errorCount > 0 ? `, ${errorCount} feil` : ''}` 
        });
      } catch (error) {
        toast({ 
          title: 'Import feilet', 
          description: 'Kunne ikke lese CSV-filen', 
          variant: 'destructive' 
        });
      }
    };

    reader.readAsText(file);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Import/Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import/Export vinlager</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Eksporter ditt vinlager til CSV eller importer viner fra en CSV-fil.
          </p>

          {/* Export */}
          <div>
            <h4 className="font-medium mb-2">Eksporter</h4>
            <Button 
              onClick={exportToCSV}
              className="w-full flex items-center gap-2"
              disabled={wines.length === 0}
            >
              <Download className="w-4 h-4" />
              Last ned som CSV ({wines.length} viner)
            </Button>
          </div>

          {/* Import */}
          <div>
            <h4 className="font-medium mb-2">Importer</h4>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Velg CSV-fil å importere
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              style={{ display: 'none' }}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>CSV-format:</strong> Navn, Årgang, Produsent, Druesort, Vintype, Alkohol %, Antall flasker, Lokasjon, Innkjøpspris, Nåværende pris, osv.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}