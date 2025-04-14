
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // First, check if a profile exists
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('[ProfilePage] Error fetching profile:', fetchError);
          setError('Kunne ikke laste brukerprofil');
          toast.error('Kunne ikke laste brukerprofil');
        } 
        
        if (data) {
          setProfile(data);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setPhone(data.phone || '');
        } else {
          // Create a profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              first_name: '',
              last_name: '',
              phone: ''
            });

          if (insertError) {
            console.error('[ProfilePage] Error creating profile:', insertError);
            setError('Kunne ikke opprette brukerprofil');
            toast.error('Kunne ikke opprette brukerprofil');
          } else {
            setProfile({
              id: user.id,
              first_name: '',
              last_name: '',
              phone: ''
            });
          }
        }
      } catch (error) {
        console.error('[ProfilePage] Error:', error);
        setError('En feil oppstod ved lasting av profil');
        toast.error('En feil oppstod ved lasting av profil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('[ProfilePage] Error updating profile:', error);
        toast.error('Kunne ikke oppdatere profil');
      } else {
        toast.success('Profil oppdatert');
        setError(null);
      }
    } catch (error) {
      console.error('[ProfilePage] Error:', error);
      toast.error('En feil oppstod ved oppdatering av profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Min profil" 
        showBackButton={true}
        showHomeButton={true}
        rightContent={
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut} 
            className="text-gray-500"
            title="Logg ut"
          >
            <LogOut size={20} />
          </Button>
        }
      />
      
      <div className="max-w-md mx-auto p-4 pt-28">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Laster profil...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" size={24} />
                Brukerinformasjon
              </CardTitle>
              <CardDescription>
                Oppdater din profil og kontaktinformasjon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">E-post kan ikke endres</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">Fornavn</Label>
                  <Input 
                    id="firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ditt fornavn"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Etternavn</Label>
                  <Input 
                    id="lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ditt etternavn"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ditt telefonnummer"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? 'Lagrer...' : 'Lagre endringer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
