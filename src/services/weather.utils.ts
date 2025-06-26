export function getConditionFromSymbol(symbol: string): string {
  const conditionMap: Record<string, string> = {
    clearsky_day: 'Sol',
    clearsky_night: 'Klar natt',
    partlycloudy_day: 'Delvis skyet',
    partlycloudy_night: 'Delvis skyet natt',
    cloudy: 'Overskyet',
    rain: 'Regn',
    lightrain: 'Lett regn',
    heavyrain: 'Kraftig regn',
    snow: 'Snø',
    lightsnow: 'Lett snø',
    heavysnow: 'Kraftig snø',
    sleet: 'Sludd',
    fog: 'Tåke',
  };

  return conditionMap[symbol] ?? 'Ukjent';
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function transformWeatherData(
  data: any,
  locationName: string,
  maxDays = 5,
) {
  const now = new Date();
  const currentData = data.properties.timeseries[0];

  const forecast = [] as any[];
  const seenDates = new Set<string>();

  for (const item of data.properties.timeseries) {
    const itemDate = new Date(item.time);
    const dateStr = itemDate.toISOString().split('T')[0];

    if (seenDates.has(dateStr) || forecast.length >= maxDays) continue;

    seenDates.add(dateStr);
    forecast.push({
      date: dateStr,
      day: itemDate.toLocaleDateString('no-NO', { weekday: 'long' }),
      temperature: {
        min: Math.round(item.data.instant.details.air_temperature - 2),
        max: Math.round(item.data.instant.details.air_temperature + 2),
      },
      condition: getConditionFromSymbol(
        item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
      ),
      icon: item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
      precipitation: item.data?.next_1_hours?.details?.precipitation_amount || 0,
      windSpeed: Math.round(item.data.instant.details.wind_speed || 0),
    });
  }

  return {
    location: locationName,
    current: {
      temperature: Math.round(currentData.data.instant.details.air_temperature),
      condition: getConditionFromSymbol(
        currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
      ),
      humidity: Math.round(currentData.data.instant.details.relative_humidity),
      windSpeed: Math.round(currentData.data.instant.details.wind_speed),
      windDirection: getWindDirection(
        currentData.data.instant.details.wind_from_direction,
      ),
      icon: currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
    },
    forecast,
    lastUpdated: now.toISOString(),
  };
}
