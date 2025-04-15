
import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import AreaButton from './AreaButton';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const DepartureAreas: React.FC = () => {
  const { departureAreas, selectArea, isAllDeparturesCompleted } = useChecklist();
  
  const handleAreaClick = (area) => {
    console.log('[DepartureAreas] Area clicked:', area.id);
    selectArea(area);
  };

  const handleLogChecklist = () => {
    // Here you would implement the actual logging logic
    toast.success("Avreisesjekk er loggført");
  };
  
  return (
    <div className="relative z-20">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Velg område</h3>
        
        {departureAreas && departureAreas.length > 0 ? (
          departureAreas.map((area) => (
            <div key={`${area.id}-${area.isCompleted}`} className="mb-3">
              <AreaButton 
                area={area} 
                onClick={() => handleAreaClick(area)}
              />
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 p-4">
            Ingen områder funnet
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm mb-4">
        Alle områder må sjekkes før avreise
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full" variant="default">
            <LogIn className="mr-2 h-4 w-4" />
            Loggfør Avreisesjekk
          </Button>
        </AlertDialogTrigger>
        {isAllDeparturesCompleted() ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bekreft loggføring</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil loggføre Avreisesjekken?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogChecklist}>
                Loggfør
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kan ikke loggføre enda</AlertDialogTitle>
              <AlertDialogDescription>
                Du må huke av for alle sjekkpunktene for å kunne loggføre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>OK</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
};

export default DepartureAreas;
