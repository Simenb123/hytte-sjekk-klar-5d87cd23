
import React from 'react';
import AppHeader from '../components/AppHeader';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WeatherApp: React.FC = () => {
  // This would normally fetch data from YR API
  const weatherData = [
    { day: 'I dag', temp: '18°', condition: 'Sol', icon: Sun },
    { day: 'Mandag', temp: '15°', condition: 'Delvis skyet', icon: Cloud },
    { day: 'Tirsdag', temp: '12°', condition: 'Regn', icon: CloudRain },
    { day: 'Onsdag', temp: '14°', condition: 'Vind', icon: Wind },
    { day: 'Torsdag', temp: '17°', condition: 'Sol', icon: Sun },
  ];

  const openYrWebsite = () => {
    window.open('https://www.yr.no', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Værmelding (YR)" showBackButton showHomeButton />
      
      <div className="max-w-lg mx-auto p-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-semibold mb-1">18°</h3>
              <p className="text-lg">Solrik</p>
              <p className="text-sm opacity-80">Hytta, Trysil</p>
            </div>
            <Sun size={64} />
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="text-sm opacity-70">Vind</p>
              <p className="text-lg font-semibold">5 m/s</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="text-sm opacity-70">Fuktighet</p>
              <p className="text-lg font-semibold">62%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          {weatherData.map((day, index) => {
            const DayIcon = day.icon;
            return (
              <div key={index} className={`flex items-center justify-between p-4 ${index < weatherData.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="font-medium">{day.day}</span>
                <div className="flex items-center">
                  <DayIcon className="text-blue-600 mr-3" size={24} />
                  <span className="text-gray-700">{day.condition}</span>
                  <span className="ml-4 font-semibold">{day.temp}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <Button 
          onClick={openYrWebsite}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
        >
          Se komplett værmelding på YR.no
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          <p>Værdata fra YR.no</p>
          <p>Sist oppdatert: 14.04.2025 10:30</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
