
import React, { useState, useEffect } from 'react';
import Layout from '@/layout/Layout';
import { Cloud, CloudRain, Sun, Wind, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeather } from '@/hooks/useWeather';
import { WEATHER_LAT, WEATHER_LON, LOCATION_NAME } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedToggle } from '@/components/weather/SegmentedToggle';
import { DayForecastDialog } from '@/components/weather/DayForecastDialog';
import { ForecastEntry } from '@/services/weather.service';

const WeatherApp: React.FC = () => {
  const [forecastDays, setForecastDays] = useState<'5' | '10'>('5');
  const [selectedDay, setSelectedDay] = useState<ForecastEntry | null>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const lat = WEATHER_LAT;
  const lon = WEATHER_LON;
  const { weatherData, loading, error, refresh } = useWeather(
    parseInt(forecastDays),
    lat,
    lon,
  );

  // Auto-refresh when forecast days change
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    refresh();
  }, [forecastDays, refresh]);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('Sol')) return Sun;
    if (condition.includes('Regn') || condition.includes('regn')) return CloudRain;
    if (condition.includes('Vind') || condition.includes('vind')) return Wind;
    return Cloud;
  };

  const openYrWebsite = (latitude: number, longitude: number) => {
    const url =
      `https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell?lat=${latitude}&lon=${longitude}`;
    window.open(url, '_blank');
  };

  const handleDayClick = (day: ForecastEntry) => {
    setSelectedDay(day);
    setIsDayDialogOpen(true);
  };

  const handlePullToRefresh = () => {
    refresh();
  };

  if (loading && !weatherData) {
    return (
      <Layout title="Værmelding" showBackButton>
        <div className="w-full p-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !weatherData) {
    return (
      <Layout title="Værmelding" showBackButton>
        <div className="w-full p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error || 'Kunne ikke laste værdata'}</p>
              <Button onClick={refresh}>Prøv igjen</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const CurrentIcon = getWeatherIcon(weatherData.current.condition);
  const currentIconClass = CurrentIcon === Sun ? 'text-yellow-300' : '';
  return (
    <Layout title="Værmelding" showBackButton>

      <div className="w-full p-4">
        <div 
          className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground mb-6 cursor-pointer select-none"
          onTouchStart={handlePullToRefresh}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5" />
                <p className="text-lg font-medium">{LOCATION_NAME}</p>
              </div>
              <h3 className="text-4xl font-bold mb-1">{weatherData.current.temperature}°</h3>
              <p className="text-lg opacity-90">{weatherData.current.condition}</p>
            </div>
            <CurrentIcon className={`${currentIconClass} drop-shadow-lg`} size={72} />
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-lg border border-white/10">
              <p className="text-sm opacity-80">Vind</p>
              <p className="text-lg font-semibold">{weatherData.current.windSpeed} m/s {weatherData.current.windDirection}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm p-3 rounded-lg border border-white/10">
              <p className="text-sm opacity-80">Fuktighet</p>
              <p className="text-lg font-semibold">{weatherData.current.humidity}%</p>
            </div>
            {weatherData.sunrise && (
              <div className="bg-white/15 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                <p className="text-sm opacity-80">Soloppgang</p>
                <p className="text-lg font-semibold">
                  {new Date(weatherData.sunrise).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {weatherData.sunset && (
              <div className="bg-white/15 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                <p className="text-sm opacity-80">Solnedgang</p>
                <p className="text-lg font-semibold">
                  {new Date(weatherData.sunset).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">{forecastDays}-dagers prognose</CardTitle>
            <SegmentedToggle
              value={forecastDays}
              onChange={setForecastDays}
              disabled={loading}
            />
          </CardHeader>
          <CardContent>
            {weatherData.forecast.map((day, index) => {
              const DayIcon = getWeatherIcon(day.condition);
              const dayIconClass = DayIcon === Sun ? 'text-yellow-500' : 'text-blue-600';
              const forecastDate = new Date(day.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              forecastDate.setHours(0, 0, 0, 0);
              const diffDays = Math.floor(
                (forecastDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              const isToday = diffDays === 0;
              const labelPrefix = isToday
                ? 'I dag '
                : diffDays === 1
                ? 'I morgen '
                : '';

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-200 hover:bg-muted/50 active:bg-muted ${
                    index < weatherData.forecast.length - 1
                      ? 'border-b border-border'
                      : ''
                  } ${isToday ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <div className="flex-1">
                    <p className={`font-medium ${isToday ? 'text-primary' : ''}`}>{
                      labelPrefix + day.day
                    }</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DayIcon className={`${dayIconClass} transition-transform group-hover:scale-110`} size={24} />
                    <div className="text-right">
                      <p className="text-foreground">{day.condition}</p>
                      <p className="font-semibold text-lg">
                        {day.temperature.min}° - {day.temperature.max}°
                      </p>
                      {day.precipitation > 0 && (
                        <p className="text-xs text-primary">
                          {day.precipitation.toFixed(1)}mm nedbør
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Trykk for detaljer →
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        
        <Button
          onClick={() => openYrWebsite(lat, lon)}
          className="w-full mb-4"
          variant="outline"
        >
          Se detaljert værmelding på YR.no
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Værdata fra Meteorologisk institutt / YR.no</p>
          <p>Sist oppdatert: {new Date(weatherData.lastUpdated).toLocaleString('no-NO')}</p>
          <p className="text-xs mt-1 opacity-70">Dra ned for å oppdatere</p>
        </div>

        {/* Day Detail Dialog */}
        {selectedDay && (
          <DayForecastDialog
            isOpen={isDayDialogOpen}
            onClose={() => setIsDayDialogOpen(false)}
            day={selectedDay}
            locationName={LOCATION_NAME}
          />
        )}
      </div>
    </Layout>
  );
};

export default WeatherApp;
