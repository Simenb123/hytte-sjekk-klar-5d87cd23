
import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';
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

const ArrivalChecklist: React.FC = () => {
  const { arrivals, toggleArrivalItem, isAllArrivalsCompleted } = useChecklist();
  
  const handleLogChecklist = () => {
    // Here you would implement the actual logging logic
    toast.success("Ankomstsjekk er loggført");
  };

  return (
    <div className="relative z-20">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {arrivals && arrivals.length > 0 ? (
          arrivals.map((item) => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              text={item.text}
              isCompleted={item.isCompleted}
              onToggle={() => toggleArrivalItem(item.id)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            Ingen ankomstpunkter funnet
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm mb-4">
        Kryss av alle punkter etter hvert som du fullfører dem
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full" variant="default">
            <LogIn className="mr-2 h-4 w-4" />
            Loggfør Ankomstsjekk
          </Button>
        </AlertDialogTrigger>
        {isAllArrivalsCompleted() ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bekreft loggføring</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil loggføre Ankomstsjekken?
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

export default ArrivalChecklist;
