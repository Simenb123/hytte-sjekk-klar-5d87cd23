
import React from 'react';
import { useChecklist } from '../context/ChecklistContext';
import ChecklistItem from './ChecklistItem';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ArrivalChecklist: React.FC = () => {
  const { arrivals, toggleArrivalItem, isAllArrivalsCompleted } = useChecklist();
  
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

      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Fullfør Ankomstsjekk
          </Button>
        </DialogTrigger>
        {isAllArrivalsCompleted() ? (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Velkommen til hytta! 🎉</DialogTitle>
              <DialogDescription className="text-center">
                Du har fullført alle punktene på ankomstsjekklisten.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Kos deg på turen! 😊
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kan ikke fullføre enda</DialogTitle>
              <DialogDescription>
                Du må huke av for alle sjekkpunktene for å kunne fullføre.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="w-full">OK</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default ArrivalChecklist;
