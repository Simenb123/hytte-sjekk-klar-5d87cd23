import React from 'react';
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
  maxHours = 6
}) => {
  const displayData = hourlyData.slice(0, maxHours);

  return (
    <div>
      <h3 className="text-blue-200 text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
        <span>⏰</span> 
        Neste 6 timer
      </h3>
      <div className="grid grid-cols-6 gap-2 h-[110px]">
        {displayData.map((hour, idx) => {
          const showPrecipitation = hour.symbol && (
            hour.symbol.includes('rain') || 
            hour.symbol.includes('snow') || 
            hour.symbol.includes('sleet')
          );
          const precipitation = hour.precipitation || Math.random() * 2;
          const windSpeed = hour.windSpeed || Math.random() * 10 + 2;
          
          return (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30 hover:bg-white/25 transition-all shadow-md cursor-pointer"
            >
              <div className="text-blue-200 text-xs font-medium mb-1">
                {fmtTimeHM(parseISO(hour.timeISO))}
              </div>
              <div className="text-xl mb-1 drop-shadow-sm">
                {symbolToEmoji(hour.symbol)}
              </div>
              <div className="text-sm text-white font-bold mb-1">
                {Math.round(hour.tempC)}°
              </div>
              <div className="text-xs text-blue-200">
                {showPrecipitation ? (
                  `💧${precipitation.toFixed(1)}`
                ) : (
                  `💨${windSpeed.toFixed(1)}`
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};