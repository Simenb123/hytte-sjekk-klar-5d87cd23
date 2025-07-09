export interface InstantDetails {
  air_temperature: number;
  relative_humidity: number;
  wind_speed: number;
  wind_from_direction: number;
  air_pressure_at_sea_level?: number;
  wind_speed_of_gust?: number;
  ultraviolet_index_clear_sky?: number;
}

export interface NextHourData {
  summary?: {
    symbol_code: string;
  };
  details?: {
    precipitation_amount: number;
  };
}

export interface NextHoursData {
  summary?: {
    symbol_code: string;
  };
  details?: {
    precipitation_amount: number;
    probability_of_precipitation: number;
  };
}

export interface TimeseriesEntry {
  time: string;
  data: {
    instant: { details: InstantDetails };
    next_1_hours?: NextHourData;
    next_6_hours?: NextHoursData;
    next_12_hours?: NextHoursData;
  };
}

export interface LocationForecast {
  properties: {
    timeseries: TimeseriesEntry[];
  };
}
