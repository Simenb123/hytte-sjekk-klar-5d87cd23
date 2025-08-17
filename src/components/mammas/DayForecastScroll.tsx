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
  maxDays = 6
}) => {
  const displayData = dailyData.slice(0, maxDays);

  return (
    <div>
      <h3 className="text-blue-200 text-sm md:text-base font-semibold mb-2 flex items-center gap-2">
        <span>📅</span> 
        Neste 6 dager
      </h3>
      <div className="grid grid-cols-6 gap-2 h-[110px]">
            {displayData.map((day, idx) => {
            const dayDate = parseISO(day.date);
            
            return (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30 hover:bg-white/25 transition-all shadow-md cursor-pointer"
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
  );
};