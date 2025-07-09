
import React from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '@/components/DashboardCard';
import Layout from '@/layout/Layout';
import { Users, ClipboardList, Package, Calendar, Cloud, MessageCircle, Gamepad2, FileText, User, BookOpen, NotebookPen } from 'lucide-react';

export default function Dashboard() {
  return (
    <Layout title="Gaustablikk">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
          <h1 className="text-3xl font-bold text-hytte-darkblue mb-8 text-center">
            Velkommen til Gaustablikk
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            
            <Link to="/calendar">
              <DashboardCard
                title="Kalender"
                description="Se kommende opphold og arrangementer"
                icon={<Calendar className="h-8 w-8" />}
                color="bg-gradient-to-br from-indigo-500 to-indigo-600"
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
                icon={<MessageCircle className="h-8 w-8" />}
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
          
          <div className="mt-8 text-center">
            <Link 
              to="/profile" 
              className="inline-flex items-center gap-2 px-4 py-2 text-hytte-darkblue hover:text-hytte-darkblue/80 transition-colors"
            >
              <User className="h-4 w-4" />
              Min profil
            </Link>
          </div>
        </div>
    </Layout>
  );
}
