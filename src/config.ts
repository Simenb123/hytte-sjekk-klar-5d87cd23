export const WEATHER_LAT = parseFloat(import.meta.env.VITE_WEATHER_LAT ?? '59.8726');
export const WEATHER_LON = parseFloat(import.meta.env.VITE_WEATHER_LON ?? '8.6475');
export const WEATHER_DATASET = import.meta.env.VITE_WEATHER_DATASET ?? 'compact';
export const YR_API_BASE = `https://api.met.no/weatherapi/locationforecast/2.0/${WEATHER_DATASET}`;
export const LOCATION_NAME = import.meta.env.VITE_LOCATION_NAME ?? 'Gaustablikk, Tinn';
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? 'contact@example.com';
