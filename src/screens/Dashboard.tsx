import React from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '@/components/dashboard/DashboardCard';
import Layout from '@/layout/Layout';
import { Users, ClipboardList, Package, Calendar, Cloud, Gamepad2, FileText, User, BookOpen, NotebookPen, Wine } from 'lucide-react';
import aiHelperImage from '@/assets/ai-helper-monkey.png';

export default function Dashboard() {
  return (
    <Layout title="Gaustablikk">
      <div className="w-full pt-2 px-4 pb-4 md:pt-4 md:px-6 md:pb-6">
          <h1 className="text-3xl font-bold text-hytte-darkblue mb-6 text-center">
            Velkommen til Gaustablikk
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/checklist">
              <DashboardCard
                title="Sjekkliste"
                description="Hold styr på alle gjøremål før, under og etter oppholdet"
                icon={<ClipboardList className="h-8 w-8" />}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
            </Link>
            
            <Link to="/inventory">
              <DashboardCard
                title="Inventar"
                description="Oversikt over alle gjenstander på hytta"
                icon={<Package className="h-8 w-8" />}
                color="bg-gradient-to-br from-green-500 to-green-600"
              />
            </Link>

            <Link to="/wine-cellar">
              <DashboardCard
                title="Vinlager"
                description="Administrer ditt personlige vinlager"
                icon={<Wine className="h-8 w-8" />}
                color="bg-gradient-to-br from-purple-800 to-red-700"
              />
            </Link>

            <Link to="/family">
              <DashboardCard
                title="Familie"
                description="Administrer familiemedlemmer og tilordne oppgaver"
                icon={<Users className="h-8 w-8" />}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
            </Link>
            
            <Link to="/booking">
              <DashboardCard
                title="Booking"
                description="Planlegg og administrer hytteopphold"
                icon={<Calendar className="h-8 w-8" />}
                color="bg-gradient-to-br from-orange-500 to-orange-600"
              />
            </Link>
            
            
            <Link to="/weather">
              <DashboardCard
                title="Vær"
                description="Værmeldingen for Gaustaområdet"
                icon={<Cloud className="h-8 w-8" />}
                color="bg-gradient-to-br from-cyan-500 to-cyan-600"
              />
            </Link>
            
            <Link to="/ai-helper">
              <DashboardCard
                title="AI-assistent"
                description="Få hjelp og råd om hytta"
                icon={<img src={aiHelperImage} alt="AI Hyttehjelper" className="h-8 w-8 rounded-full object-cover object-center scale-150" style={{ filter: 'brightness(1.1) contrast(1.2)' }} />}
                color="bg-gradient-to-br from-rose-500 to-rose-600"
              />
            </Link>
            
            <Link to="/documents">
              <DashboardCard
                title="Dokumenter"
                description="Administrer hytte-manualer og guider"
                icon={<BookOpen className="h-8 w-8" />}
                color="bg-gradient-to-br from-teal-500 to-teal-600"
              />
            </Link>

            <Link to="/hyttebok">
              <DashboardCard
                title="Hytteboka"
                description="Skriv og les hytteinnlegg"
                icon={<NotebookPen className="h-8 w-8" />}
                color="bg-gradient-to-br from-yellow-500 to-yellow-600"
              />
            </Link>

            <Link to="/mammas-hjorne">
              <DashboardCard
                title="Mammas hjørne"
                description="Infoskjerm for mamma"
                icon={<User className="h-8 w-8" />}
                color="bg-gradient-to-br from-pink-500 to-pink-600"
              />
            </Link>

            <Link to="/other-apps">
              <DashboardCard
                title="Andre apper"
                description="Nyttige apper for hyttelivet"
                icon={<Gamepad2 className="h-8 w-8" />}
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
            </Link>
            
            <Link to="/logs">
              <DashboardCard
                title="Logger"
                description="Se systemlogger og feilmeldinger"
                icon={<FileText className="h-8 w-8" />}
                color="bg-gradient-to-br from-gray-500 to-gray-600"
              />
            </Link>
          </div>
          
        </div>
    </Layout>
  );
}
