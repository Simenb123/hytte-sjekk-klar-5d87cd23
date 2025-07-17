import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ForecastEntry } from '@/services/weather.service';
import { Cloud, CloudRain, Sun, Wind, Droplets, Gauge, Eye, Thermometer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DayForecastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  day: ForecastEntry;
  locationName: string;
}

export const DayForecastDialog: React.FC<DayForecastDialogProps> = ({
  isOpen,
  onClose,
  day,
  locationName,
}) => {
  const getWeatherIcon = (condition: string) => {
    if (condition.includes('Sol')) return Sun;
    if (condition.includes('Regn') || condition.includes('regn')) return CloudRain;
    if (condition.includes('Vind') || condition.includes('vind')) return Wind;
    return Cloud;
  };

  const WeatherIcon = getWeatherIcon(day.condition);
  const iconClass = WeatherIcon === Sun ? 'text-amber-500' : 'text-primary';

  // Generate hourly data (mock for now - in real app would come from API)
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const baseTemp = (day.temperature.min + day.temperature.max) / 2;
    const variation = Math.sin((i - 6) * Math.PI / 12) * (day.temperature.max - day.temperature.min) / 2;
    return {
      hour: i,
      temperature: Math.round(baseTemp + variation),
      precipitation: Math.max(0, day.precipitation * (0.5 + Math.random() * 0.5)),
      windSpeed: Math.round(day.windSpeed * (0.8 + Math.random() * 0.4)),
      condition: day.condition,
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <WeatherIcon className={`w-6 h-6 ${iconClass}`} />
            Detaljert prognose for {day.day}
            <span className="text-muted-foreground text-base font-normal">
              - {locationName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Temperatur</p>
                    <p className="font-semibold">{day.temperature.min}° - {day.temperature.max}°</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nedbør</p>
                    <p className="font-semibold">{day.precipitation.toFixed(1)} mm</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vind</p>
                    <p className="font-semibold">{day.windSpeed} m/s</p>
                  </div>
                </div>
                {day.airPressure && (
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lufttrykk</p>
                      <p className="font-semibold">{Math.round(day.airPressure)} hPa</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Forecast */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Time for time prognose
            </h3>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {hourlyData.map((hour) => (
                <div
                  key={hour.hour}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium w-12">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </div>
                    <WeatherIcon className={`w-4 h-4 ${iconClass}`} />
                    <div className="text-sm text-muted-foreground min-w-0 flex-1">
                      {hour.condition}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-red-500" />
                      <span className="font-medium">{hour.temperature}°</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span>{hour.precipitation.toFixed(1)}mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-gray-500" />
                      <span>{hour.windSpeed}m/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};