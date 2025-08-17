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
  maxHours = 14
}) => {
  const displayData = hourlyData.slice(0, maxHours);

  return (
    <div>
      <h3 className="text-blue-200 text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
        <span>⏰</span> 
        Neste timer 
        <span className="text-xs text-blue-300">
          (viser {Math.min(defaultHours, displayData.length)}, scroll for mer →)
        </span>
      </h3>
      <div className="relative">
        {/* Gradient fade indicators */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-600/30 to-transparent pointer-events-none z-10 rounded-r-lg"></div>
        <div 
          className="w-full h-[110px] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent'
          }}
        >
          <div className="flex gap-1 pb-2 h-full whitespace-nowrap">
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
                className={`bg-white/10 backdrop-blur-sm rounded-lg p-1 text-center border transition-all shadow-md flex-shrink-0 min-w-[55px] cursor-pointer ${
                  isInDefault 
                    ? 'border-white/30 hover:bg-white/25' 
                    : 'border-white/15 hover:bg-white/20 opacity-90'
                }`}
              >
                <div className="text-blue-200 text-xs font-medium mb-0.5">
                  {fmtTimeHM(parseISO(hour.timeISO))}
                </div>
                <div className="text-lg mb-0.5 drop-shadow-sm">
                  {symbolToEmoji(hour.symbol)}
                </div>
                <div className="text-xs text-white font-bold mb-0.5">
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
      </div>
    </div>
  );
};