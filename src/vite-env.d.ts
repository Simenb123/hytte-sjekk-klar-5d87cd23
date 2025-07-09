/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEATHER_LAT?: string;
  readonly VITE_WEATHER_LON?: string;
  readonly VITE_WEATHER_DATASET?: string;
  readonly VITE_LOCATION_NAME?: string;
  readonly VITE_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
