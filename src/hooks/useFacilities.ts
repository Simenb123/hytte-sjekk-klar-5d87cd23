import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Facility {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon_url?: string;
  is_seasonal: boolean;
  season: string;
  created_at: string;
  updated_at: string;
}

export interface BookingFacilityUsage {
  id: string;
  booking_id: string | null;
  facility_id: string;
  user_id: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
  facilities?: Facility;
}

export const useFacilities = () => {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Facility[];
    },
  });
};

export const useFacilityUsage = (bookingId: string | null) => {
  return useQuery({
    queryKey: ['facility-usage', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      
      const { data, error } = await supabase
        .from('booking_facilities_used')
        .select(`
          *,
          facilities (*)
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;
      return data as BookingFacilityUsage[];
    },
    enabled: !!bookingId,
  });
};

export const useUpdateFacilityUsage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      facilityId, 
      bookingId, 
      isUsed 
    }: { 
      facilityId: string; 
      bookingId: string | null; 
      isUsed: boolean; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('booking_facilities_used')
        .upsert({
          facility_id: facilityId,
          booking_id: bookingId,
          user_id: user.id,
          is_used: isUsed,
        }, {
          onConflict: 'booking_id,facility_id,user_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-usage'] });
      toast({
        title: "Fasilitetsbruk oppdatert",
        description: "Endringene er lagret",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere fasilitetsbruk",
        variant: "destructive",
      });
    },
  });
};

export const useCreateFacility = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (facility: Omit<Facility, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('facilities')
        .insert(facility)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast({
        title: "Fasilitet opprettet",
        description: "Ny fasilitet er lagt til",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette fasilitet",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFacility = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Facility> }) => {
      const { data, error } = await supabase
        .from('facilities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast({
        title: "Fasilitet oppdatert",
        description: "Endringene er lagret",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere fasilitet",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFacility = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast({
        title: "Fasilitet slettet",
        description: "Fasiliteten er fjernet",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved sletting",
        description: "Kunne ikke slette fasilitet",
        variant: "destructive",
      });
    },
  });
};