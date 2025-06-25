
export interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    day: string;
    temperature: {
      min: number;
      max: number;
    };
    condition: string;
    icon: string;
    precipitation: number;
    windSpeed: number;
  }>;
  lastUpdated: string;
}

export class WeatherService {
  private static readonly GAUSTABLIKK_LAT = 59.8726;
  private static readonly GAUSTABLIKK_LON = 8.6475;
  private static readonly YR_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
  private static cache: { data: WeatherData; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static async getWeatherData(): Promise<WeatherData | null> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.data;
    }
    try {
      const response = await fetch(
        `${this.YR_API_BASE}?lat=${this.GAUSTABLIKK_LAT}&lon=${this.GAUSTABLIKK_LON}`,
        {
          headers: {
            'User-Agent': 'Gaustablikk-Hytte-App/1.0 (contact@example.com)',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch weather data:', response.status);
        return null;
      }

      const data = await response.json();
      const transformed = this.transformWeatherData(data);
      this.cache = { data: transformed, timestamp: Date.now() };
      return transformed;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  private static transformWeatherData(data: any): WeatherData {
    const now = new Date();
    const currentData = data.properties.timeseries[0];
    
    // Get forecast for next 5 days
    const forecast = [];
    const seenDates = new Set();
    
    for (const item of data.properties.timeseries) {
      const itemDate = new Date(item.time);
      const dateStr = itemDate.toISOString().split('T')[0];
      
      if (seenDates.has(dateStr) || forecast.length >= 5) continue;
      
      seenDates.add(dateStr);
      forecast.push({
        date: dateStr,
        day: itemDate.toLocaleDateString('no-NO', { weekday: 'long' }),
        temperature: {
          min: Math.round(item.data.instant.details.air_temperature - 2),
          max: Math.round(item.data.instant.details.air_temperature + 2),
        },
        condition: this.getConditionFromSymbol(item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day'),
        icon: item.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
        precipitation: item.data?.next_1_hours?.details?.precipitation_amount || 0,
        windSpeed: Math.round(item.data.instant.details.wind_speed || 0),
      });
    }

    return {
      location: 'Gaustablikk, Tinn',
      current: {
        temperature: Math.round(currentData.data.instant.details.air_temperature),
        condition: this.getConditionFromSymbol(currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day'),
        humidity: Math.round(currentData.data.instant.details.relative_humidity),
        windSpeed: Math.round(currentData.data.instant.details.wind_speed),
        windDirection: this.getWindDirection(currentData.data.instant.details.wind_from_direction),
        icon: currentData.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day',
      },
      forecast,
      lastUpdated: now.toISOString(),
    };
  }

  private static getConditionFromSymbol(symbol: string): string {
    const conditionMap: Record<string, string> = {
      'clearsky_day': 'Sol',
      'clearsky_night': 'Klar natt',
      'partlycloudy_day': 'Delvis skyet',
      'partlycloudy_night': 'Delvis skyet natt',
      'cloudy': 'Overskyet',
      'rain': 'Regn',
      'lightrain': 'Lett regn',
      'heavyrain': 'Kraftig regn',
      'snow': 'Snø',
      'lightsnow': 'Lett snø',
      'heavysnow': 'Kraftig snø',
      'sleet': 'Sludd',
      'fog': 'Tåke',
    };
    
    return conditionMap[symbol] || 'Ukjent';
  }

  private static getWindDirection(degrees: number): string {
    const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }
}
