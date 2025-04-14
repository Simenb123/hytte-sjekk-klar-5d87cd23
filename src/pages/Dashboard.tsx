
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import { ClipboardCheck, SunMedium, Calendar, AppWindow, LogIn } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Logging for debugging purposes
    console.log('[Dashboard] Rendering with user:', user?.id);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hytte Dashboard" />
      
      <div className="max-w-lg mx-auto p-4 pt-24">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Applikasjoner</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <DashboardCard 
              to="/checklist"
              title="Sjekklister" 
              description="Ankomst og avreise" 
              icon={<ClipboardCheck size={24} />} 
              color="bg-blue-500"
            />
            
            <DashboardCard 
              to="/weather"
              title="Været" 
              description="Lokal værmelding" 
              icon={<SunMedium size={24} />} 
              color="bg-orange-500"
            />
            
            <DashboardCard 
              to="/calendar"
              title="Kalender" 
              description="Hyttereservasjoner" 
              icon={<Calendar size={24} />} 
              color="bg-green-500"
            />
            
            <DashboardCard 
              to="/other-apps"
              title="Andre apper" 
              description="Flere smarte verktøy" 
              icon={<AppWindow size={24} />} 
              color="bg-purple-500"
            />
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Konto</h2>
          
          <DashboardCard 
            to="/auth"
            title={user ? "Administrer konto" : "Logg inn"} 
            description={user ? "Endre innstillinger" : "Eller opprett ny konto"} 
            icon={<LogIn size={24} />} 
            color="bg-gray-700"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
