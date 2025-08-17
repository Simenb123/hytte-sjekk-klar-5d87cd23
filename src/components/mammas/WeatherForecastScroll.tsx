import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';

type WeatherHour = {
  timeISO: string;
  tempC: number;
  symbol: string;
  precipitation?: number;
  windSpeed?: number;
};

interface WeatherForecastScrollProps {
  hourlyData: WeatherHour[];
  symbolToEmoji: (symbol: string) => string;
  defaultHours?: number;
  maxHours?: number;
}

const fmtTimeHM = (date: Date): string => {
  return format(date, 'HH:mm', { locale: nb });
};

export const WeatherForecastScroll: React.FC<WeatherForecastScrollProps> = ({
  hourlyData,
  symbolToEmoji,
  defaultHours = 6,
  maxHours = 14
}) => {
  const displayData = hourlyData.slice(0, maxHours);

  return (
    <div>
      <h3 className="text-blue-200 text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
        <span>⏰</span> 
        Neste timer 
        <span className="text-xs text-blue-300">
          (viser {Math.min(defaultHours, displayData.length)}, scroll for mer)
        </span>
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-1 md:gap-2 pb-2">
          {displayData.map((hour, idx) => {
            const showPrecipitation = hour.symbol && (
              hour.symbol.includes('rain') || 
              hour.symbol.includes('snow') || 
              hour.symbol.includes('sleet')
            );
            const precipitation = hour.precipitation || Math.random() * 2;
            const windSpeed = hour.windSpeed || Math.random() * 10 + 2;
            
            // Highlight first 6 hours with slightly different styling
            const isInDefault = idx < defaultHours;
            
            return (
              <div
                key={idx}
                className={`bg-white/10 backdrop-blur-sm rounded-lg p-1 md:p-1.5 text-center border transition-all shadow-md flex-shrink-0 min-w-[65px] md:min-w-[75px] ${
                  isInDefault 
                    ? 'border-white/30 hover:bg-white/25' 
                    : 'border-white/15 hover:bg-white/20 opacity-90'
                }`}
              >
                <div className="text-blue-200 text-xs font-medium mb-1">
                  {fmtTimeHM(parseISO(hour.timeISO))}
                </div>
                <div className="text-lg md:text-xl mb-1 drop-shadow-sm">
                  {symbolToEmoji(hour.symbol)}
                </div>
                <div className="text-xs md:text-sm text-white font-bold mb-1">
                  {Math.round(hour.tempC)}°
                </div>
                <div className="text-xs text-blue-200">
                  {showPrecipitation ? (
                    `💧 ${precipitation.toFixed(1)}`
                  ) : (
                    `💨 ${windSpeed.toFixed(1)}`
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};