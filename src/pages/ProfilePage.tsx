
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Loader2 } from 'lucide-react';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { useProfile } from '@/hooks/useProfile';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, isSaving, error, updateProfile } = useProfile(user);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Min profil" 
        showBackButton={true}
        onBackClick={handleBackClick}
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
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="ml-2 text-gray-500">Laster profil...</p>
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
              <ProfileForm 
                user={user}
                profile={profile}
                isSaving={isSaving}
                onSubmit={updateProfile}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
