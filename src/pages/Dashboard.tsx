
import React from 'react';
import Header from '../components/Header';
import DashboardCard from '../components/DashboardCard';
import { Check, CalendarDays, FileText } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Hytte-sjekk-klar" 
        showBackButton={false}
        showHomeButton={false}
      />
      
      <div className="max-w-4xl mx-auto p-4 pt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard 
            linkTo="/checklist"
            icon={<Check className="h-8 w-8" />}
            title="Sjekklister"
            description="Gå gjennom sjekkpunkter for ankomst og avreise"
            color="bg-blue-500"
          />
          
          <DashboardCard 
            linkTo="/bookings"
            icon={<CalendarDays className="h-8 w-8" />}
            title="Reservasjoner"
            description="Administrer reservasjoner og kalender"
            color="bg-green-500"
          />
          
          <DashboardCard 
            linkTo="/logs"
            icon={<FileText className="h-8 w-8" />}
            title="Logger"
            description="Se fullførte sjekkpunkter og aktivitet"
            color="bg-purple-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
