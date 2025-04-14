
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

  useEffect(() => {
    const loadChecklists = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const [arrivalItems, departureAreasWithItems] = await Promise.all([
          getArrivalItemsWithStatus(user.id),
          getDepartureAreasWithItems(user.id)
        ]);
        
        const convertedArrivals = arrivalItems.map((item: ChecklistItemWithStatus): ChecklistItem => ({
          id: item.id,
          text: item.text,
          isCompleted: item.isCompleted
        }));
        
        const convertedDepartureAreas = departureAreasWithItems.map((area: AreaWithItems): ChecklistArea => ({
          id: area.id,
          name: area.name,
          isCompleted: area.isCompleted,
          items: area.items.map(item => ({
            id: item.id,
            text: item.text,
            isCompleted: item.isCompleted
          }))
        }));
        
        setArrivals(convertedArrivals);
        setDepartureAreas(convertedDepartureAreas);
        
      } catch (error) {
        console.error('[useChecklistData] Error loading from Supabase:', error);
        toast.error('Kunne ikke laste sjekklister. Prøv igjen senere.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChecklists();
  }, [user]);

  return { arrivals, setArrivals, departureAreas, setDepartureAreas, isLoading };
};
