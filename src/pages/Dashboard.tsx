
import React from 'react';
import { CheckSquare, CloudSun, Calendar, Layers, LogIn, User } from 'lucide-react';
import AppHeader from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  console.log('[Dashboard] Rendering with user:', user?.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hytte Dashboard" />
      
      <main className="container max-w-5xl mx-auto px-4 py-8 pt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Sjekklister"
            description="Ankomst- og avreisesjekk"
            icon={<CheckSquare className="h-6 w-6" />}
            linkTo="/checklist"
            color="bg-emerald-500"
          />
          
          <DashboardCard
            title="Værmelding"
            description="Lokalt vær og varsler"
            icon={<CloudSun className="h-6 w-6" />}
            linkTo="/weather"
            color="bg-sky-500"
          />
          
          <DashboardCard
            title="Kalender"
            description="Booking og planlegging"
            icon={<Calendar className="h-6 w-6" />}
            linkTo="/calendar"
            color="bg-indigo-500"
          />
          
          <DashboardCard
            title="Min Profil"
            description="Se og endre profilen din"
            icon={<User className="h-6 w-6" />}
            linkTo="/profile"
            color="bg-amber-500"
          />
          
          <DashboardCard
            title="Andre tjenester"
            description="Nyttige ressurser"
            icon={<Layers className="h-6 w-6" />}
            linkTo="/other-apps"
            color="bg-purple-500"
          />
          
          {!user && (
            <DashboardCard
              title="Logg inn"
              description="Få tilgang til alle funksjoner"
              icon={<LogIn className="h-6 w-6" />}
              linkTo="/auth"
              color="bg-blue-500"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
