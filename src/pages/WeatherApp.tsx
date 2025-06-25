
import React, { useState } from 'react';
import Header from '../components/Header';
import { Cloud, CloudRain, Sun, Wind, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeather } from '@/hooks/useWeather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherSettingsDialog } from '@/components/weather/WeatherSettingsDialog';
import { WeatherService } from '@/services/weather.service';
import { WeatherLocation } from '@/types/weather';

const WeatherApp: React.FC = () => {
  const [location, setLocation] = useState<WeatherLocation>(
    WeatherService.getPreferredLocation()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { weatherData, loading, error, refetch } = useWeather(location);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('Sol')) return Sun;
    if (condition.includes('Regn') || condition.includes('regn')) return CloudRain;
    if (condition.includes('Vind') || condition.includes('vind')) return Wind;
    return Cloud;
  };

  const openYrWebsite = () => {
    window.open('https://www.yr.no/nb/værvarsel/daglig-tabell/1-68536/Norge/Telemark/Tinn/Gaustablikk%20Fjellresort', '_blank');
  };

  if (loading && !weatherData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="Værmelding"
          showBackButton
          rightContent={
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          }
        />
        <WeatherSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          location={location}
          onSave={(loc) => {
            setLocation(loc);
            WeatherService.savePreferredLocation(loc);
            refetch();
          }}
        />
        <div className="max-w-lg mx-auto p-4 pt-20">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title="Værmelding"
          showBackButton
          rightContent={
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          }
        />
        <WeatherSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          location={location}
          onSave={(loc) => {
            setLocation(loc);
            WeatherService.savePreferredLocation(loc);
            refetch();
          }}
        />
        <div className="max-w-lg mx-auto p-4 pt-20">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error || 'Kunne ikke laste værdata'}</p>
              <Button onClick={refetch}>Prøv igjen</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const CurrentIcon = getWeatherIcon(weatherData.current.condition);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Værmelding"
        showBackButton
        rightContent={
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        }
      />
      <WeatherSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        location={location}
        onSave={(loc) => {
          setLocation(loc);
          WeatherService.savePreferredLocation(loc);
          refetch();
        }}
      />
      
      <div className="max-w-lg mx-auto p-4 pt-20">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-semibold mb-1">{weatherData.current.temperature}°</h3>
              <p className="text-lg">{weatherData.current.condition}</p>
              <p className="text-sm opacity-80">{weatherData.location}</p>
            </div>
            <CurrentIcon size={64} />
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="text-sm opacity-70">Vind</p>
              <p className="text-lg font-semibold">{weatherData.current.windSpeed} m/s {weatherData.current.windDirection}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <p className="text-sm opacity-70">Fuktighet</p>
              <p className="text-lg font-semibold">{weatherData.current.humidity}%</p>
            </div>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">5-dagers prognose</CardTitle>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {weatherData.forecast.map((day, index) => {
              const DayIcon = getWeatherIcon(day.condition);
              return (
                <div key={index} className={`flex items-center justify-between p-4 ${index < weatherData.forecast.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex-1">
                    <p className="font-medium">{day.day}</p>
                    <p className="text-sm text-gray-500">{new Date(day.date).toLocaleDateString('no-NO')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DayIcon className="text-blue-600" size={24} />
                    <div className="text-right">
                      <p className="text-gray-700">{day.condition}</p>
                      <p className="font-semibold">{day.temperature.min}° - {day.temperature.max}°</p>
                      {day.precipitation > 0 && (
                        <p className="text-xs text-blue-600">{day.precipitation}mm nedbør</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        
        <Button 
          onClick={openYrWebsite}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
        >
          Se detaljert værmelding på YR.no
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          <p>Værdata fra Meteorologisk institutt / YR.no</p>
          <p>Sist oppdatert: {new Date(weatherData.lastUpdated).toLocaleString('no-NO')}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
