
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Loader2 } from 'lucide-react';
import { ProfileForm } from '@/components/profile/ProfileForm';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import { useProfile } from '@/hooks/useProfile';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, isSaving, error, updateProfile } = useProfile(user);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <Layout
      title="Min profil"
      showBackButton
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
    >

      <div className="w-full p-4">
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
                Innstillinger
              </CardTitle>
              <CardDescription>
                Administrer din profil og varselinnstillinger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="notifications">Varsler</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-6">
                  <div className="pt-6">
                    <ProfileForm 
                      user={user}
                      profile={profile}
                      isSaving={isSaving}
                      onSubmit={updateProfile}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="notifications" className="space-y-6">
                  <div className="pt-6">
                    <NotificationSettings />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
