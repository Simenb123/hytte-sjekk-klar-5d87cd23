import { weatherConditions } from '../../../src/shared/weatherConditions.ts'
import type { LocationForecast } from '../../../src/types/weather.types'

export interface WeatherData {
  location: string
  current: {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
    windDirection: string
    pressure?: number
    windGust?: number
    uvIndex?: number
  }
  forecast: Array<{
    date: string
    day: string
    temperature: { min: number; max: number }
    condition: string
    precipitation: number
    windSpeed: number
  }>
  sunrise?: string
  sunset?: string
  lastUpdated: string
}

const LOCATION_NAME = Deno.env.get('LOCATION_NAME') ?? 'Gaustablikk, Tinn'

export function transformWeatherData(
  data: LocationForecast,
  maxDays = 5,
): WeatherData {
  const now = new Date()
  const currentData = data.properties.timeseries[0]

  // Get forecast for the next "maxDays" days
  const forecast = []
  const seenDates = new Set<string>()

  for (const item of data.properties.timeseries) {
    const itemDate = new Date(item.time)
    const dateStr = itemDate.toISOString().split('T')[0]

    if (seenDates.has(dateStr) || forecast.length >= maxDays) continue

    seenDates.add(dateStr)
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
      precipitation: item.data?.next_1_hours?.details?.precipitation_amount || 0,
      windSpeed: Math.round(item.data.instant.details.wind_speed || 0),
    })
  }

  return {
    location: LOCATION_NAME,
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
      pressure: Math.round(
        currentData.data.instant.details.air_pressure_at_sea_level || 0,
      ),
      windGust: Math.round(
        currentData.data.instant.details.wind_speed_of_gust || 0,
      ),
      uvIndex: Math.round(
        currentData.data.instant.details.ultraviolet_index_clear_sky ?? 0,
      ),
    },
    forecast,
    sunrise: undefined,
    sunset: undefined,
    lastUpdated: now.toISOString(),
  }
}

export function getConditionFromSymbol(symbol: string): string {
  return weatherConditions[symbol] || 'Ukjent'
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

export function getÅrstid(måned: number): string {
  if (måned >= 2 && måned <= 4) return 'Vår'
  if (måned >= 5 && måned <= 7) return 'Sommer'
  if (måned >= 8 && måned <= 10) return 'Høst'
  return 'Vinter'
}
