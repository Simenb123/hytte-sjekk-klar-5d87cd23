
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
}

export function useProfile(user: User | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        console.log('[useProfile] Fetching profile for user:', user.id);
        
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('[useProfile] Error fetching profile:', fetchError);
          setError('Kunne ikke laste brukerprofil');
          toast.error('Kunne ikke laste brukerprofil');
          return;
        } 
        
        if (data) {
          console.log('[useProfile] Profile fetched successfully:', data);
          setProfile(data);
        } else {
          console.log('[useProfile] No profile found, creating one');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              first_name: '',
              last_name: '',
              phone: ''
            });

          if (insertError) {
            console.error('[useProfile] Error creating profile:', insertError);
            setError('Kunne ikke opprette brukerprofil');
            toast.error('Kunne ikke opprette brukerprofil');
          } else {
            setProfile({
              id: user.id,
              first_name: '',
              last_name: '',
              phone: '',
              gender: null,
              birth_date: null
            });
          }
        }
      } catch (error) {
        console.error('[useProfile] Error:', error);
        setError('En feil oppstod ved lasting av profil');
        toast.error('En feil oppstod ved lasting av profil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (data: { first_name: string; last_name: string; phone: string; gender?: string; birth_date?: string }) => {
    if (!user) return;

    setIsSaving(true);
    try {
      console.log('[useProfile] Updating profile for user:', user.id);
      
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('[useProfile] Error updating profile:', error);
        toast.error('Kunne ikke oppdatere profil');
        setError('Kunne ikke oppdatere profil: ' + error.message);
      } else {
        console.log('[useProfile] Profile updated successfully:', updatedProfile);
        toast.success('Profil oppdatert');
        setError(null);
        setProfile(updatedProfile[0]);
      }
    } catch (error: unknown) {
      console.error('[useProfile] Error:', error);
      toast.error('En feil oppstod ved oppdatering av profil');
      if (error instanceof Error) {
        setError('En feil oppstod ved oppdatering av profil: ' + error.message);
      } else {
        setError('En feil oppstod ved oppdatering av profil');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return { profile, isLoading, isSaving, error, updateProfile };
}
