
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import DashboardCard from '../components/DashboardCard';
import { 
  ClipboardCheck, 
  CloudSun, 
  Calendar as CalendarIcon, 
  AppWindow 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-lg mx-auto p-4">
        <div className="my-6">
          <Logo />
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          <DashboardCard 
            to="/checklist"
            icon={<ClipboardCheck size={32} />}
            title="Hytteapp - sjekklister"
            description="Sjekklister for ankomst og avreise"
            color="bg-blue-600"
          />
          
          <DashboardCard 
            to="/weather"
            icon={<CloudSun size={32} />}
            title="Værmelding (YR)"
            description="Sjekk været på hytta"
            color="bg-cyan-600"
          />
          
          <DashboardCard 
            to="/calendar"
            icon={<CalendarIcon size={32} />}
            title="Kalender og booking"
            description="Se og legg til bookinger"
            color="bg-purple-600"
          />
          
          <DashboardCard 
            to="/other-apps"
            icon={<AppWindow size={32} />}
            title="Andre apper"
            description="Flere nyttige verktøy for hytta"
            color="bg-green-600"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
