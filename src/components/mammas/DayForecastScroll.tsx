import React from 'react';
import { parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';

type WeatherDay = {
  date: string;
  minTemp: number;
  maxTemp: number;
  symbol: string;
  description?: string;
};

interface DayForecastScrollProps {
  dailyData: WeatherDay[];
  symbolToEmoji: (symbol: string) => string;
  defaultDays?: number;
  maxDays?: number;
}

const fmtDayShort = (date: Date): string => {
  return format(date, 'EEE', { locale: nb });
};

const fmtDateShort = (date: Date): string => {
  return format(date, 'd. MMM', { locale: nb });
};

export const DayForecastScroll: React.FC<DayForecastScrollProps> = ({
  dailyData,
  symbolToEmoji,
  defaultDays = 6,
  maxDays = 14
}) => {
  const displayData = dailyData.slice(0, maxDays);

  return (
    <div>
      <h3 className="text-blue-200 text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
        <span>📅</span> 
        Neste dager 
        <span className="text-xs text-blue-300">
          (viser {Math.min(defaultDays, displayData.length)}, scroll for mer →)
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
            {displayData.map((day, idx) => {
            const dayDate = parseISO(day.date);
            
            // Highlight first 6 days with slightly different styling
            const isInDefault = idx < defaultDays;
            
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
                  {fmtDayShort(dayDate)}
                </div>
                <div className="text-blue-200 text-xs mb-0.5">
                  {fmtDateShort(dayDate)}
                </div>
                <div className="text-lg mb-0.5 drop-shadow-sm">
                  {symbolToEmoji(day.symbol)}
                </div>
                <div className="text-xs text-white font-bold">
                  {Math.round(day.maxTemp)}°/{Math.round(day.minTemp)}°
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