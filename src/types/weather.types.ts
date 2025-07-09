export interface InstantDetails {
  air_temperature: number;
  relative_humidity: number;
  wind_speed: number;
  wind_from_direction: number;
  air_pressure_at_sea_level?: number;
  cloud_area_fraction?: number;
  wind_speed_of_gust?: number;
}

export interface NextHourData {
  summary?: {
    symbol_code: string;
  };
  details?: {
    precipitation_amount: number;
  };
}

export interface TimeseriesEntry {
  time: string;
  data: {
    instant: { details: InstantDetails };
    next_1_hours?: NextHourData;
  };
}

export interface LocationForecast {
  properties: {
    timeseries: TimeseriesEntry[];
  };
}
