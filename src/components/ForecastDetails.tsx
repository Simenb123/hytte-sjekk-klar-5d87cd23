import React from 'react';
import { HourlyForecast } from '@/services/weather.service';

interface ForecastDetailsProps {
  hourly: HourlyForecast[];
}

const ForecastDetails: React.FC<ForecastDetailsProps> = ({ hourly }) => {
  return (
    <div className="bg-gray-50">
      {hourly.map((h, idx) => (
        <div
          key={h.time}
          className={`flex justify-between text-sm px-4 py-1 ${
            idx < hourly.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <span className="w-16">
            {new Date(h.time).toLocaleTimeString('no-NO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>{h.temperature}°</span>
          {h.precipitation > 0 && (
            <span className="text-blue-600">{h.precipitation}mm</span>
          )}
          <span className="text-gray-500">{h.windSpeed} m/s</span>
        </div>
      ))}
    </div>
  );
};

export default ForecastDetails;
