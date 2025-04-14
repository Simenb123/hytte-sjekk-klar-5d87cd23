
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChecklistItem, ChecklistArea } from '../models/checklist';
import { useAuth } from '../context/AuthContext';
import { 
  getArrivalItemsWithStatus, 
  getDepartureAreasWithItems 
} from '../services/checklist.service';
import { AreaWithItems, ChecklistItemWithStatus } from '../types/database.types';

export const useChecklistData = () => {
  const { user } = useAuth();
  const [arrivals, setArrivals] = useState<ChecklistItem[]>([]);
  const [departureAreas, setDepartureAreas] = useState<ChecklistArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChecklists = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('[useChecklistData] Loading checklists for user:', user.id);
        
        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled([
          getArrivalItemsWithStatus(user.id),
          getDepartureAreasWithItems(user.id)
        ]);
        
        // Handle arrival items
        if (results[0].status === 'fulfilled') {
          const arrivalItems = results[0].value;
          const convertedArrivals = arrivalItems.map((item: ChecklistItemWithStatus): ChecklistItem => ({
            id: item.id,
            text: item.text,
            isCompleted: item.isCompleted === true
          }));
          
          console.log('[useChecklistData] Loaded arrivals:', convertedArrivals.length);
          setArrivals(convertedArrivals);
        } else {
          console.error('[useChecklistData] Failed to load arrival items:', results[0].reason);
          setError('Kunne ikke laste ankomstsjekkliste');
        }
        
        // Handle departure areas
        if (results[1].status === 'fulfilled') {
          const departureAreasWithItems = results[1].value;
          const convertedDepartureAreas = departureAreasWithItems.map((area: AreaWithItems): ChecklistArea => ({
            id: area.id,
            name: area.name,
            isCompleted: area.isCompleted === true,
            items: area.items.map(item => ({
              id: item.id,
              text: item.text,
              isCompleted: item.isCompleted === true
            }))
          }));
          
          console.log('[useChecklistData] Loaded departure areas:', convertedDepartureAreas.length);
          setDepartureAreas(convertedDepartureAreas);
        } else {
          console.error('[useChecklistData] Failed to load departure areas:', results[1].reason);
          setError(prev => prev ? `${prev}. Kunne ikke laste avreisesjekkliste` : 'Kunne ikke laste avreisesjekkliste');
        }
        
        // If both failed, set a more general error
        if (results[0].status === 'rejected' && results[1].status === 'rejected') {
          setError('Kunne ikke laste sjekklister. Prøv igjen senere.');
          toast.error('Kunne ikke laste sjekklister. Prøv igjen senere.');
        }
      } catch (error) {
        console.error('[useChecklistData] Error loading from Supabase:', error);
        setError('Kunne ikke laste sjekklister. Prøv igjen senere.');
        toast.error('Kunne ikke laste sjekklister. Prøv igjen senere.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChecklists();
  }, [user]);

  return { arrivals, setArrivals, departureAreas, setDepartureAreas, isLoading, error };
};
