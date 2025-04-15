
import React from 'react';

interface CalendarInfoProps {
  isGoogleConnected: boolean;
}

export const CalendarInfo: React.FC<CalendarInfoProps> = ({ isGoogleConnected }) => {
  return (
    <div className="text-center text-sm text-gray-500">
      <p>Datoer markert med rødt er allerede booket</p>
      {isGoogleConnected && <p>Google Calendar er tilkoblet og klar til bruk!</p>}
    </div>
  );
};
