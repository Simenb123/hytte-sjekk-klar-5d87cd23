
import React from 'react';
import AppHeader from '../components/AppHeader';
import DashboardCard from '../components/DashboardCard';
import { 
  Snowflake, 
  Wrench, 
  PhoneCall, 
  Map, 
  FileCheck, 
  Camera 
} from 'lucide-react';
import { toast } from 'sonner';

const OtherApps: React.FC = () => {
  const handleAppClick = (appName: string) => {
    toast.info(`${appName} kommer snart!`, {
      description: 'Denne appen er under utvikling.',
    });
  };

  const openExternalLink = (url: string, appName: string) => {
    window.open(url, '_blank');
    toast.success(`Åpner ${appName} i App Store`, {
      description: 'Installer appen for full funksjonalitet',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Andre apper" showBackButton showHomeButton />
      
      <div className="max-w-lg mx-auto p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div onClick={() => openExternalLink('https://apps.apple.com/no/app/gausta/id1447369775?l=nb', 'Gausta')} className="cursor-pointer">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="bg-blue-600 p-4 text-white flex items-center justify-center">
                <Snowflake size={32} />
              </div>
              <div className="p-3">
                <h3 className="text-base font-semibold mb-1">Gausta</h3>
                <p className="text-gray-600 text-xs">Åpne Gausta-appen</p>
              </div>
            </div>
          </div>
          
          <div onClick={() => openExternalLink('https://apps.apple.com/no/app/hyttetjenester-appen/id1481330344?l=nb', 'Hyttetjenester')} className="cursor-pointer">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="bg-amber-600 p-4 text-white flex items-center justify-center">
                <Wrench size={32} />
              </div>
              <div className="p-3">
                <h3 className="text-base font-semibold mb-1">Hyttetjenester</h3>
                <p className="text-gray-600 text-xs">Åpne Hyttetjenester-appen</p>
              </div>
            </div>
          </div>
          
          <div onClick={() => openExternalLink('https://apps.apple.com/no/app/skisporet/id404514360?l=nb', 'Skisporet')} className="cursor-pointer">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="bg-green-600 p-4 text-white flex items-center justify-center">
                <Map size={32} />
              </div>
              <div className="p-3">
                <h3 className="text-base font-semibold mb-1">Skisporet</h3>
                <p className="text-gray-600 text-xs">Åpne Skisporet-appen</p>
              </div>
            </div>
          </div>
          
          <div onClick={() => handleAppClick('Kontaktliste')} className="cursor-pointer">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="bg-purple-600 p-4 text-white flex items-center justify-center">
                <PhoneCall size={32} />
              </div>
              <div className="p-3">
                <h3 className="text-base font-semibold mb-1">Kontaktliste</h3>
                <p className="text-gray-600 text-xs">Viktige telefonnumre</p>
              </div>
            </div>
          </div>
          
          <div onClick={() => handleAppClick('Inventarliste')} className="cursor-pointer">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="bg-indigo-600 p-4 text-white flex items-center justify-center">
                <FileCheck size={32} />
              </div>
              <div className="p-3">
                <h3 className="text-base font-semibold mb-1">Inventarliste</h3>
                <p className="text-gray-600 text-xs">Oversikt over hyttas eiendeler</p>
              </div>
            </div>
          </div>
          
          <div onClick={() => handleAppClick('Fotogalleri')} className="cursor-pointer">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full">
              <div className="bg-rose-600 p-4 text-white flex items-center justify-center">
                <Camera size={32} />
              </div>
              <div className="p-3">
                <h3 className="text-base font-semibold mb-1">Fotogalleri</h3>
                <p className="text-gray-600 text-xs">Bilder fra hytta</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>Klikk på app-ikonene for å åpne offisielle apper</p>
        </div>
      </div>
    </div>
  );
};

export default OtherApps;
