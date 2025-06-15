
import { Link } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import AppHeader from '../components/AppHeader';
import { Calendar, ListChecks, Bot, Archive } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Dashbord" />

      <main className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Kalender"
            description="Se og administrer bookinger"
            linkTo="/bookings"
            icon={<Calendar className="h-8 w-8 text-blue-600" />}
          />
          <DashboardCard
            title="Sjekklister"
            description="Rutiner for ankomst og avreise"
            linkTo="/checklists"
            icon={<ListChecks className="h-8 w-8 text-green-600" />}
          />
          <DashboardCard
            title="Hyttehjelper"
            description="Spør vår AI-assistent om hytta"
            linkTo="/ai-helper"
            icon={<Bot className="h-8 w-8 text-purple-600" />}
          />
          <DashboardCard
            title="Inventar"
            description="Se og administrer gjenstander"
            linkTo="/inventory"
            icon={<Archive className="h-8 w-8 text-orange-600" />}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
