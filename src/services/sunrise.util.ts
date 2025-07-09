import { WEATHER_LAT, WEATHER_LON, CONTACT_EMAIL } from '@/config';

export interface SunTimes {
  sunrise: string;
  sunset: string;
}

export async function fetchSunTimes(
  lat: number = WEATHER_LAT,
  lon: number = WEATHER_LON,
  date: string = new Date().toISOString().split('T')[0],
): Promise<SunTimes | null> {
  try {
    const url = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${lon}&date=${date}&offset=+00:00`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': `Gaustablikk-Hytte-App/1.0 (${CONTACT_EMAIL})`,
      },
    });
    if (!res.ok) {
      console.error('[fetchSunTimes] Failed', res.status);
      return null;
    }
    const data = await res.json();
    const first = data?.location?.time?.[0];
    const sunrise = first?.sunrise?.time;
    const sunset = first?.sunset?.time;
    if (!sunrise || !sunset) return null;
    return { sunrise, sunset };
  } catch (e) {
    console.error('[fetchSunTimes] Error', e);
    return null;
  }
}
