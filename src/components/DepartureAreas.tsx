
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChecklist } from '../context/ChecklistContext';
import AreaButton from './AreaButton';
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

const DepartureAreas: React.FC = () => {
  const navigate = useNavigate();
  const { departureAreas, selectArea, isAllDeparturesCompleted } = useChecklist();
  
  const handleAreaClick = (area) => {
    console.log('[DepartureAreas] Area clicked:', area.id);
    selectArea(area);
  };

  const handleCompletionConfirm = () => {
    navigate('/');
  };
  
  return (
    <div className="relative z-20">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-3">Velg område</h3>
        
        {departureAreas && departureAreas.length > 0 ? (
          departureAreas.map((area) => (
            <div key={area.id} className="mb-3">
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

      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Fullfør Avreisesjekk
          </Button>
        </DialogTrigger>
        {isAllDeparturesCompleted() ? (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">God tur hjem! 👋</DialogTitle>
              <DialogDescription className="text-center">
                Du har fullført alle punktene på avreisesjekklisten.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={handleCompletionConfirm}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                Hytta er nå sikret 🏠
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

export default DepartureAreas;
