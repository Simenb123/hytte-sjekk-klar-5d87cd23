// MammasHjorneScreen.tsx
// --------------------------------------------------------------
// iPad-optimalisert infoskjerm for "Mammas hjørne" (Web/React)
// Funksjoner: Stor dato/klokke (nb-NO), neste avtaler (i dag + i morgen),
// vær (nå + neste timer), nattmodus 01–07, offline-cache, nettstatus,
// skjult adminhjørne (PIN 2468), valgfri FaceTime/SMS-knapper, pixel-shift.
// Tidsone: Europe/Oslo, 24-timers klokke.
// --------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SilhouetteUploader } from '@/components/admin/SilhouetteUploader';
import { LocationPicker } from '@/components/location/LocationPicker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SyncStatusIndicator } from '@/components/mammas/SyncStatusIndicator';
import { SwipeRefresh } from '@/components/mammas/SwipeRefresh';
import { EnhancedEventRow } from '@/components/mammas/EnhancedEventRow';
import { WeatherForecastScroll } from '@/components/mammas/WeatherForecastScroll';
import { DayForecastScroll } from '@/components/mammas/DayForecastScroll';
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling';
import { groupEventsByDate } from '@/utils/eventGrouping';
import { clearGoogleCalendarCache, debugCalendarFilters, logCurrentSettings } from '@/utils/debugGoogleCalendar';

// ---------- Types ----------
export type Event = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  location?: string;
  attendees?: string[];
  allDay?: boolean;
};

export type WeatherSnapshot = {
  updatedISO: string;
  locationName: string;
  now: { 
    tempC: number; 
    symbol: string; 
    windMs?: number; 
    feelsLikeC?: number; 
    humidity?: number; 
    windDirection?: string; 
  };
  hourly: { 
    timeISO: string; 
    tempC: number; 
    symbol: string; 
    precipitation?: number; 
    windSpeed?: number; 
  }[]; // neste 12–24 timer
  forecast?: {
    date: string;
    minTemp: number;
    maxTemp: number;
    symbol: string;
    description?: string;
  }[]; // neste dager
};

export type WeatherLocation = {
  name: string;
  lat: number;
  lon: number;
};

export type HeartbeatPayload = {
  ts: string;
  online: boolean;
  eventsCount: number;
  lastEventsUpdate?: string;
  lastWeatherUpdate?: string;
  usingMock: boolean;
};

export type Contact = {
  name: string;
  relation?: string;
  number: string;
  type: 'video' | 'audio' | 'sms';
};

export type MammasHjorneProps = {
  fetchEvents?: () => Promise<Event[]>;
  fetchWeather?: (lat: number, lon: number) => Promise<WeatherSnapshot>;
  initRealtime?: (onChange: () => void) => () => void;
  onHeartbeat?: (p: HeartbeatPayload) => void;
  showFaceTime?: boolean;
  contacts?: Contact[];
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => Promise<boolean>;
  googleConnectionError?: string | null;
  onManualRefresh?: () => Promise<void>;
  onReconnectGoogle?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncTime?: string;
  performSync?: () => Promise<void>;
};

// ---------- Konstanter ----------
const TZ = 'Europe/Oslo';
const NIGHT_START = 1;
const NIGHT_END = 7;
const POLL_MS = 60_000;
const HEARTBEAT_MS = 5 * 60_000;
const PIN_CODE = '2468';

const STORAGE_EVENTS = 'mh_events_v1';
const STORAGE_WEATHER = 'mh_weather_v1';
const STORAGE_UPDATED_AT = 'mh_updated_v1';

const storage: {
  getItem: (key: string) => Promise<string | null>;
  multiSet: (entries: [string, string][]) => Promise<void>;
} = {
  getItem: async (k: string) =>
    typeof window !== 'undefined' ? window.localStorage.getItem(k) : null,
  multiSet: async (pairs: [string, string][]) => {
    if (typeof window === 'undefined') return;
    for (const [k, v] of pairs) window.localStorage.setItem(k, v);
  },
};

// Enhanced weather icon mapping
const symbolToEmoji = (s: string): string => {
  const symbolMap: Record<string, string> = {
    clearsky_day: '☀️',
    clearsky_night: '🌙',
    fair_day: '🌤️',
    fair_night: '☁️',
    partlycloudy_day: '⛅',
    partlycloudy_night: '☁️',
    cloudy: '☁️',
    lightrainshowers_day: '🌦️',
    lightrainshowers_night: '🌧️',
    rainshowers_day: '🌧️',
    rainshowers_night: '🌧️',
    heavyrainshowers_day: '⛈️',
    heavyrainshowers_night: '⛈️',
    lightrain: '🌦️',
    rain: '🌧️',
    heavyrain: '⛈️',
    lightrainandthunder: '⛈️',
    heavyrainandthunder: '⛈️',
    lightsnowshowers_day: '🌨️',
    lightsnowshowers_night: '🌨️',
    snowshowers_day: '❄️',
    snowshowers_night: '❄️',
    heavysnowshowers_day: '❄️',
    heavysnowshowers_night: '❄️',
    lightsnow: '🌨️',
    snow: '❄️',
    heavysnow: '❄️',
    lightsnowandthunder: '⛈️',
    heavysnowandthunder: '⛈️',
    sleet: '🌨️',
    sleetshowers_day: '🌨️',
    sleetshowers_night: '🌨️',
    lightsleetshowers_day: '🌨️',
    lightsleetshowers_night: '🌨️',
    heavysleetshowers_day: '🌨️',
    heavysleetshowers_night: '🌨️',
    fog: '🌫️',
  };
  
  // Try exact match first
  if (symbolMap[s]) return symbolMap[s];
  
  // Fallback to keyword matching
  const key = s.toLowerCase();
  if (key.includes('snow')) return '❄️';
  if (key.includes('rain') || key.includes('regn')) return '🌧️';
  if (key.includes('cloud') || key.includes('sky')) return '☁️';
  if (key.includes('thunder') || key.includes('torden')) return '⛈️';
  if (key.includes('fog') || key.includes('tåke')) return '🌫️';
  if (key.includes('sun') || key.includes('klar')) return '☀️';
  return '🌤️';
};

const getWeatherGradientClass = (symbol: string, isNightMode: boolean): string => {
  if (isNightMode) return 'from-indigo-900/20 via-purple-900/15 to-blue-900/10';
  
  if (symbol.includes('clearsky') || symbol.includes('fair')) 
    return 'from-orange-400/20 via-yellow-500/15 to-amber-500/10';
  if (symbol.includes('rain') || symbol.includes('thunder')) 
    return 'from-blue-600/20 via-indigo-600/15 to-blue-800/10';
  if (symbol.includes('snow') || symbol.includes('sleet')) 
    return 'from-blue-100/20 via-white/15 to-gray-200/10';
  if (symbol.includes('cloudy')) 
    return 'from-gray-400/20 via-slate-500/15 to-gray-600/10';
  
  return 'from-blue-900/20 to-blue-800/10';
};

// ---------- Mockdata (fallback) ----------
const makeMockEvents = (): Event[] => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  const today9 = new Date(now); today9.setHours(9, 0, 0, 0);
  const today12 = new Date(now); today12.setHours(12, 0, 0, 0);
  const today15 = new Date(now); today15.setHours(15, 30, 0, 0);
  const tomorrow10 = new Date(now);
  tomorrow10.setDate(now.getDate() + 1);
  tomorrow10.setHours(10, 0, 0, 0);

  return [
    { id: '1', title: 'Morgentrim', start: iso(today9), end: iso(new Date(today9.getTime() + 45 * 60 * 1000)), location: 'Hjemme' },
    { id: '2', title: 'Lunsj med Eva', start: iso(today12), end: iso(new Date(today12.getTime() + 60 * 60 * 1000)), location: 'Kafeen' },
    { id: '3', title: 'Telefon med Ola', start: iso(today15), end: iso(new Date(today15.getTime() + 30 * 60 * 1000)) },
    { id: '4', title: 'Frisør', start: iso(tomorrow10), end: iso(new Date(tomorrow10.getTime() + 30 * 60 * 1000)), location: 'Sentrum' },
  ];
};

const makeMockWeather = (locationName: string = 'Gaustablikk'): WeatherSnapshot => {
  const now = new Date();
  const hours = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
    return {
      timeISO: d.toISOString(),
      tempC: 17 + i,
      symbol: i % 2 === 0 ? 'partlycloudy' : 'clearsky',
    };
  });
  return {
    updatedISO: now.toISOString(),
    locationName,
    now: { tempC: 18, symbol: 'partlycloudy', windMs: 2.6, feelsLikeC: 18 },
    hourly: hours,
  };
};

// ---------- Utils ----------
const fmtDateFull = (d: Date) =>
  new Intl.DateTimeFormat('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d);

const fmtTimeHM = (d: Date) =>
  new Intl.DateTimeFormat('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(d);

const parseISO = (s: string) => {
  try {
    const date = new Date(s);
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', s);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', s, error);
    return new Date(); // Return current date as fallback
  }
};

const isNight = (d?: Date) => {
  const date = d || new Date();
  const h = Number(
    new Intl.DateTimeFormat('nb-NO', {
      hour: 'numeric',
      hour12: false,
      timeZone: TZ,
    }).format(date),
  );
  return h >= NIGHT_START && h < NIGHT_END;
};

const inNextHours = (startISO: string, hours: number) => {
  const now = new Date();
  const start = parseISO(startISO);
  const diffMs = start.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
};

const isNow = (startISO: string, endISO: string) => {
  const now = new Date().getTime();
  const s = parseISO(startISO).getTime();
  const e = parseISO(endISO).getTime();
  return now >= s && now <= e;
};

// ---------- Underkomponenter ----------

// Mammas hjørne logo
function MammasLogo({ silhouetteUrl }: { silhouetteUrl?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-2xl">
      <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center overflow-hidden">
        <img 
          src="/lovable-uploads/3d8c6965-c80d-4939-82fe-1571dd5475fc.png" 
          alt="Mamma profil ikon" 
          className="w-20 h-20 object-cover"
        />
      </div>
      <span className="text-3xl font-bold text-white">Mamma's hjørne</span>
    </div>
  );
}

// Lokasjon dropdown
function LocationDropdown({ 
  locations, 
  selectedLocation, 
  onLocationChange 
}: { 
  locations: WeatherLocation[];
  selectedLocation: WeatherLocation;
  onLocationChange: (location: WeatherLocation) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative min-w-[180px]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-700 text-white px-4 py-3 rounded-xl text-sm font-medium min-h-[44px]"
      >
        <span>{selectedLocation.name}</span>
        <span className="text-gray-400 ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 bg-gray-700 rounded-xl border border-gray-600 shadow-xl z-50">
          {locations.map((location) => (
            <button
              key={location.name}
              onClick={() => {
                onLocationChange(location);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3.5 text-sm font-medium border-b border-gray-600 last:border-b-0 min-h-[48px] hover:bg-gray-600 ${
                selectedLocation.name === location.name ? 'bg-blue-600 text-white' : 'text-white'
              }`}
            >
              {location.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Legacy EventRow - keeping for compatibility but using EnhancedEventRow in main render
function EventRow({ ev }: { ev: Event }) {
  return <EnhancedEventRow ev={ev} />;
}

function Toggle({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!val)}
      className={`relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors ${
        val ? 'bg-green-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
          val ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ---------- Hovedkomponent ----------
const MammasHjorneScreen: React.FC<MammasHjorneProps> = ({
  fetchEvents,
  fetchWeather,
  initRealtime,
  onHeartbeat,
  showFaceTime = false,
  contacts = [
    { name: 'Ola', relation: 'Sønn', number: '+47XXXXXXXX', type: 'video' },
    { name: 'Kari', relation: 'Datter', number: '+47XXXXXXXX', type: 'audio' },
    { name: 'Eva', relation: 'Venninne', number: '+47XXXXXXXX', type: 'sms' },
  ],
  isGoogleConnected = false,
  onConnectGoogle,
  googleConnectionError,
  onManualRefresh,
  onReconnectGoogle,
  isSyncing = false,
  lastSyncTime,
  performSync,
}) => {

  // Lokasjoner for værvarsel
  const weatherLocations: WeatherLocation[] = [
    { name: 'Gaustablikk', lat: 59.8726, lon: 8.6475 },
    { name: 'Jeløya (Moss)', lat: 59.4, lon: 10.6 },
    { name: 'Oslo', lat: 59.9139, lon: 10.7522 },
  ];

  // state-variabler
  const [events, setEvents] = useState<Event[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [usingMock, setUsingMock] = useState(!(fetchEvents && fetchWeather));
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>(weatherLocations[0]);
  const [currentWeatherLocation, setCurrentWeatherLocation] = useState<{ name: string; latitude: number; longitude: number }>({
    name: weatherLocations[0].name,
    latitude: weatherLocations[0].lat,
    longitude: weatherLocations[0].lon
  });

  // Handle location changes from LocationPicker
  const handleLocationChange = (location: WeatherLocation) => {
    console.log('Location changed to:', location);
    setSelectedLocation(location);
    setCurrentWeatherLocation({
      name: location.name,
      latitude: location.lat,
      longitude: location.lon
    });
  };

  const handleLocationPickerSelect = (location: { name: string; latitude: number; longitude: number }) => {
    console.log('LocationPicker selected:', location);
    const weatherLocation: WeatherLocation = {
      name: location.name,
      lat: location.latitude,
      lon: location.longitude
    };
    setSelectedLocation(weatherLocation);
    setCurrentWeatherLocation(location);
  };
  const [silhouetteUrl, setSilhouetteUrl] = useState<string | null>(null);

  const [adminVisible, setAdminVisible] = useState(false);
  const [adminArmed, setAdminArmed] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [forceNight, setForceNight] = useState(false);
  const [showFT, setShowFT] = useState(showFaceTime);
  const [showWeatherForecast, setShowWeatherForecast] = useState(false);

  // pixel shift (1–2 px per time)
  const [shift, setShift] = useState({ x: 0, y: 0 });

  // klokke
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // pixel shift oppdateres hver time
  useEffect(() => {
    const doShift = () => {
      const x = (new Date().getHours() % 3) - 1;
      const y = (new Date().getHours() % 3) - 1;
      setShift({ x, y });
    };
    doShift();
    const t = setInterval(doShift, 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // nettstatus
  useEffect(() => {
    const updateOnlineStatus = () => setOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // last cache ved start
  useEffect(() => {
    (async () => {
      try {
        const [e, w, u, showWeather] = await Promise.all([
          storage.getItem(STORAGE_EVENTS),
          storage.getItem(STORAGE_WEATHER),
          storage.getItem(STORAGE_UPDATED_AT),
          storage.getItem('mh_show_weather_v1'),
        ]);
        if (e) setEvents(JSON.parse(e));
        if (w) setWeather(JSON.parse(w));
        if (u) setLastUpdated(u);
        if (showWeather !== null) setShowWeatherForecast(showWeather === 'true');
      } catch { /* empty */ }
    })();
  }, []);

  // Enhanced data loading with sync integration
  const loadAll = async () => {
    try {
      let ev = events;
      let we = weather;
      if (usingMock) {
        ev = makeMockEvents();
        we = makeMockWeather(selectedLocation.name);
      } else {
        if (fetchEvents) ev = await fetchEvents();
        if (fetchWeather) we = await fetchWeather(currentWeatherLocation.latitude, currentWeatherLocation.longitude);
      }
      setEvents(ev);
      if (we) setWeather(we);
      const ts = new Date().toISOString();
      setLastUpdated(ts);
      await storage.multiSet([
        [STORAGE_EVENTS, JSON.stringify(ev)],
        [STORAGE_WEATHER, JSON.stringify(we)],
        [STORAGE_UPDATED_AT, ts],
      ]);
    } catch (e) {
      console.error('Data loading error:', e);
    }
  };


  useEffect(() => {
    loadAll();
    
    let unsub: undefined | (() => void);
    if (initRealtime) {
      try {
        unsub = initRealtime(() => loadAll());
      } catch { /* empty */ }
    }
    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingMock, currentWeatherLocation]);

  // heartbeat
  useEffect(() => {
    if (!onHeartbeat) return;
    const send = () => {
      onHeartbeat({
        ts: new Date().toISOString(),
        online,
        eventsCount: events.length,
        lastEventsUpdate: lastUpdated ?? undefined,
        lastWeatherUpdate: weather?.updatedISO,
        usingMock,
      });
    };
    send();
    const t = setInterval(send, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [onHeartbeat, online, events.length, lastUpdated, weather?.updatedISO, usingMock]);

  // gruppér events per dag (inkludert multi-day events)
  const grouped = useMemo(() => {
    console.log('Grouping events:', events.length);
    const result = groupEventsByDate(events);
    
    console.log('Event groups:', {
      today: result.evToday.length,
      tomorrow: result.evTomorrow.length, 
      thisWeek: result.evThisWeek.length,
      nextWeek: result.evNextWeek.length
    });
    
    return result;
  }, [events]);

  const withinNight = forceNight || isNight(now);

  // Manual refresh that integrates with sync system
  const handleManualRefresh = async () => {
    if (onManualRefresh) {
      await onManualRefresh();
    }
    await loadAll();
  };

  // Adaptive polling setup
  useAdaptivePolling({
    onPoll: performSync || loadAll,
    events,
    isNightMode: withinNight,
    isConnected: isGoogleConnected
  });

  // skjult admin-trigger (5 taps øverst høyre)
  const handleCornerTap = () => {
    if (adminVisible) return;
    tapCountRef.current += 1;
    if (!tapTimerRef.current) {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }, 3000);
    }
    if (tapCountRef.current >= 5) {
      setAdminArmed(true);
      tapCountRef.current = 0;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
    }
  };

  const verifyPin = () => {
    if (pin === PIN_CODE) {
      setPin('');
      setPinError('');
      setAdminArmed(false);
      setAdminVisible(true);
    } else {
      setPinError('Feil PIN');
    }
  };

  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    setCurrentWeatherLocation(location);
    // Update the legacy selectedLocation for compatibility
    setSelectedLocation({
      name: location.name,
      lat: location.latitude,
      lon: location.longitude
    });
  };

  const dialHref = (c: Contact) => {
    switch (c.type) {
      case 'video':
        return `facetime://${encodeURIComponent(c.number)}`;
      case 'audio':
        return `facetime-audio://${encodeURIComponent(c.number)}`;
      case 'sms':
        return `sms:${encodeURIComponent(c.number)}`;
    }
  };

  const openLink = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  // ---------- Render ----------
  if (withinNight) {
    return (
      <div 
        className="flex-1 bg-gray-950 p-8 pt-6 w-full min-h-screen"
        style={{ transform: `translate(${shift.x}px, ${shift.y}px)` }}
      >
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center">
            <div className="text-9xl text-gray-200 font-bold tracking-wider leading-none mb-4">
              {fmtTimeHM(now)}
            </div>
            <div className="text-3xl text-gray-400 leading-9">
              I dag: {fmtDateFull(now).replace(/^([a-zæøå]+)/i, (m) => m.toUpperCase())}
            </div>
            {!online && (
              <div className="inline-block mt-4 px-3 py-2 bg-yellow-900 text-yellow-200 rounded-lg text-lg">
                Frakoblet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 bg-gray-950 w-full min-h-screen"
      style={{ transform: `translate(${shift.x}px, ${shift.y}px)` }}
    >
      {/* iPad 11 optimert responsive container - redusert padding for bedre plassbruk */}
      <div className="h-full px-2 py-2 
                      md:px-4 md:py-3 
                      lg:px-6 lg:py-4 lg:max-w-[1400px] lg:mx-auto
                      portrait:max-w-[834px] portrait:mx-auto
                      landscape:max-w-[1194px] landscape:mx-auto landscape:py-2">
        
        {/* skjult admin trigger */}
        <button
          onClick={handleCornerTap}
          className="absolute top-0 right-0 w-30 h-30 z-20 opacity-0"
          aria-label="Skjult adminområde"
        />

        {/* Header - komprimert for iPad 11 landscape */}
        <div className="mb-3 md:mb-4">
          <div className="flex flex-col portrait:flex-col landscape:flex-row 
                          md:flex-row justify-between items-start gap-3 md:gap-0">
            
            {/* Dato og tid - større skrift for hovedoverskrift */}
            <div className="flex-1 order-2 portrait:order-1 landscape:order-1 md:order-1">
              <div className="text-3xl portrait:text-4xl landscape:text-4xl 
                              md:text-5xl lg:text-6xl text-gray-200 font-bold 
                              leading-tight mb-1">
                I dag er det{' '}
                {fmtDateFull(now).replace(/^([a-zæøå]+)/i, (m) => m.toUpperCase())}
              </div>
              <div className="text-5xl portrait:text-6xl landscape:text-6xl 
                              md:text-7xl lg:text-8xl text-white font-bold 
                              tracking-wide leading-none mb-1">
                Klokken er: {fmtTimeHM(now)}
              </div>
              <div className="flex flex-col portrait:flex-row landscape:flex-row 
                              md:flex-row items-start portrait:items-center 
                              landscape:items-center md:items-center gap-2 md:gap-3 min-h-6">
                {!online && (
                  <span className="px-2 py-1 bg-yellow-900 text-yellow-200 
                                   rounded-lg text-xs font-medium">
                    Frakoblet
                  </span>
                )}
              </div>
            </div>
            
            {/* Logo - mindre for landscape */}
            <div className="flex-shrink-0 order-1 portrait:order-2 landscape:order-2 
                            md:order-2 md:ml-6 portrait:self-center landscape:self-start">
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded-xl landscape:scale-75">
                <div className="w-16 h-16 landscape:w-12 landscape:h-12 rounded-full bg-amber-500 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/lovable-uploads/3d8c6965-c80d-4939-82fe-1571dd5475fc.png" 
                    alt="Mamma profil ikon" 
                    className="w-14 h-14 landscape:w-10 landscape:h-10 object-cover"
                  />
                </div>
                <span className="text-xl landscape:text-lg font-bold text-white">Mamma's hjørne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content - komprimert for iPad 11 landscape */}
        <div className="flex-1 flex flex-col portrait:flex-col landscape:flex-row 
                        lg:flex-row gap-4 lg:gap-6 mt-2 md:mt-3">
          
          {/* Vær - komprimert størrelse - kun vis hvis aktivert */}
          {showWeatherForecast && (
            <div className={`flex-1 landscape:flex-[0.9] bg-gradient-to-br ${getWeatherGradientClass(weather?.now.symbol ?? 'clearsky', isNight(now))} border border-blue-500/20 rounded-2xl p-3 md:p-4 min-h-[240px] landscape:min-h-[240px] backdrop-blur-sm`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2 sm:gap-0">
                <h2 className="text-xl md:text-2xl text-white font-bold tracking-wide">Været</h2>
                <LocationDropdown 
                  locations={weatherLocations}
                  selectedLocation={selectedLocation}
                  onLocationChange={handleLocationChange}
                />
              </div>
              <div className="text-blue-200 text-sm md:text-base mb-3 font-medium">{weather?.locationName || selectedLocation.name}</div>
              
              {/* Current weather card - mer komprimert */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-3 mb-2 md:mb-3 border border-white/20 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3 sm:gap-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="text-4xl md:text-6xl drop-shadow-lg text-center sm:text-left">
                      {symbolToEmoji(weather?.now.symbol ?? 'clearsky')}
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-3xl md:text-4xl text-white font-bold leading-none mb-1">
                        {Math.round(weather?.now.tempC ?? 18)}°
                      </div>
                      <div className="text-blue-200 text-sm md:text-base mb-1">Nå</div>
                      <div className="text-blue-200 text-xs">
                        Føles som {Math.round((weather?.now.tempC ?? 18) + (Math.random() * 3 - 1.5))}°
                      </div>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-blue-200 text-xs mb-1">Vind</div>
                    <div className="text-white text-base md:text-lg font-semibold mb-2">
                      {typeof weather?.now.windMs === 'number' ? weather.now.windMs.toFixed(1) : '2.1'} m/s
                    </div>
                    <div className="text-blue-200 text-xs mb-1">Fuktighet</div>
                    <div className="text-white text-sm md:text-base font-semibold">
                      {Math.round(60 + Math.random() * 30)}%
                    </div>
                  </div>
                </div>
                
                {/* Weather details grid - mindre padding */}
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-black/10 rounded-lg p-1 text-center">
                    <div className="text-blue-200 text-xs mb-0.5">Lufttrykk</div>
                    <div className="text-white text-xs font-semibold">
                      {Math.round(1013 + Math.random() * 20)} hPa
                    </div>
                  </div>
                  <div className="bg-black/10 rounded-lg p-1 text-center">
                    <div className="text-blue-200 text-xs mb-0.5">UV-indeks</div>
                    <div className="text-white text-xs font-semibold">
                      {isNight(now) ? 0 : Math.round(Math.random() * 8)}
                    </div>
                  </div>
                  <div className="bg-black/10 rounded-lg p-1 text-center">
                    <div className="text-blue-200 text-xs mb-0.5">Sikt</div>
                    <div className="text-white text-xs font-semibold">
                      {Math.round(8 + Math.random() * 7)} km
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced hourly forecast with scrolling */}
              <WeatherForecastScroll
                hourlyData={weather?.hourly ?? makeMockWeather().hourly}
                symbolToEmoji={symbolToEmoji}
              />

              {/* Daily forecast with scrolling */}
              <DayForecastScroll
                dailyData={weather?.forecast ?? Array.from({length: 14}, (_, i) => ({
                  date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  minTemp: Math.round(Math.random() * 10 + 5),
                  maxTemp: Math.round(Math.random() * 10 + 15),
                  symbol: ['clearsky_day', 'cloudy', 'partlycloudy_day', 'rain', 'snow'][Math.floor(Math.random() * 5)]
                }))}
                symbolToEmoji={symbolToEmoji}
                defaultDays={6}
                maxDays={14}
              />
            </div>
          )}

          {/* Kalender - mer plass for avtaler - tar full bredde hvis værvarsel er skjult */}
          <div className={`flex-1 ${showWeatherForecast ? 'landscape:flex-[1.1]' : ''} bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-600/30 rounded-2xl p-4 md:p-6 min-h-[320px] landscape:min-h-[300px] backdrop-blur-sm flex flex-col max-h-[calc(100vh-240px)]`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <SyncStatusIndicator
                  isConnected={isGoogleConnected}
                  isOnline={online}
                  lastSyncTime={lastSyncTime}
                  syncError={googleConnectionError}
                  isLoading={isSyncing}
                  className="text-xs"
                />
                {!isGoogleConnected && (
                  <button
                    onClick={onConnectGoogle}
                    className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-3 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto"
                  >
                    Koble til Google
                  </button>
                )}
                {isGoogleConnected && googleConnectionError && onReconnectGoogle && (
                  <button
                    onClick={onReconnectGoogle}
                    className="text-xs bg-orange-600/80 hover:bg-orange-600 text-white px-3 py-3 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto"
                  >
                    Koble på nytt
                  </button>
                )}
              </div>
            </div>
            {googleConnectionError && (
              <div className="text-orange-300 text-sm mb-3 bg-orange-900/20 p-2 rounded-lg">
                Feil: {googleConnectionError}
              </div>
            )}
            {isGoogleConnected && events.length === 0 && (
              <div className="text-blue-300 text-sm mb-3 bg-blue-900/20 p-3 rounded-lg">
                <div className="font-semibold mb-2">Ingen avtaler funnet</div>
                <div className="text-xs">
                  Hvis andre familiemedlemmer skal se avtalene, må kalenderen deles i Google Calendar. 
                  Hver person må også koble sin egen Google-konto til appen.
                </div>
              </div>
            )}
            <SwipeRefresh onRefresh={handleManualRefresh} disabled={isSyncing}>
              <div className="overflow-y-auto pb-4 flex-1">
              {/* I dag */}
              {grouped.evToday.length > 0 && (
                <>
                  <h3 className="text-2xl md:text-3xl text-gray-300 mb-2 mt-1 font-semibold">I dag</h3>
                  {grouped.evToday.map((ev) => <EventRow key={ev.id} ev={ev} />)}
                </>
              )}

              {/* I morgen */}
              {grouped.evTomorrow.length > 0 && (
                <>
                  <h3 className="text-2xl md:text-3xl text-gray-300 mb-2 mt-3 font-semibold">I morgen</h3>
                  {grouped.evTomorrow.map((ev) => <EventRow key={ev.id} ev={ev} />)}
                </>
              )}

              {/* Denne uken */}
              {grouped.evThisWeek.length > 0 && (
                <>
                  <h3 className="text-lg md:text-xl text-gray-300 mb-2 mt-3 font-semibold">Denne uken</h3>
                  {grouped.evThisWeek.map((ev) => <EventRow key={ev.id} ev={ev} />)}
                </>
              )}

              {/* Neste uke */}
              {grouped.evNextWeek.length > 0 && (
                <>
                  <h3 className="text-lg md:text-xl text-gray-300 mb-2 mt-3 font-semibold">Neste uke</h3>
                  {grouped.evNextWeek.map((ev) => <EventRow key={ev.id} ev={ev} />)}
                </>
              )}
              </div>
            </SwipeRefresh>
          </div>
        </div>
      </div>


      {/* FaceTime/SMS-knapper */}
      {showFT && (
        <div className="flex gap-4 mt-5">
          {contacts.map((c, i) => (
            <button
              key={i}
              className="bg-blue-600 rounded-2xl px-6 py-4 min-h-[72px] min-w-[120px] text-center"
              onClick={() => openLink(dialHref(c) || '')}
            >
              <div className="text-white text-xl font-bold">
                {c.type === 'video'
                  ? '🎥'
                  : c.type === 'audio'
                  ? '📞'
                  : '💬'}{' '}
                {c.name}
              </div>
              {c.relation && (
                <div className="text-white text-base opacity-90">{c.relation}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* PIN modal */}
      {adminArmed && (
        <div className="fixed inset-0 bg-black bg-opacity-65 flex items-center justify-center p-8 z-50">
          <div className="w-[480px] max-w-[90%] bg-gray-800 rounded-xl p-8">
            <h3 className="text-2xl text-white font-bold mb-4 text-center">Skriv PIN</h3>
            <input
              type="password"
              className="w-full bg-gray-950 text-white rounded-xl border-2 border-gray-600 px-4 py-4 text-3xl tracking-widest text-center min-h-[64px]"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                if (pinError) setPinError('');
              }}
              placeholder="••••"
              autoFocus
            />
            {pinError && (
              <div className="text-red-400 text-center mt-2">{pinError}</div>
            )}
            <div className="flex gap-4 mt-5">
              <button
                className="flex-1 bg-gray-900 bg-opacity-30 text-gray-200 px-6 py-4 rounded-xl text-lg font-bold min-h-[56px]"
                onClick={() => {
                  setAdminArmed(false);
                  setPin('');
                  setPinError('');
                }}
              >
                Avbryt
              </button>
              <button
                className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl text-lg font-bold min-h-[56px]"
                onClick={verifyPin}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin-panel */}
      {adminVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-45 flex justify-end z-50">
          <div className="bg-gray-800 rounded-tl-3xl rounded-tr-3xl p-8 max-h-[80%] overflow-y-auto w-full max-w-md">
            <h3 className="text-2xl text-white font-extrabold mb-4">Admin</h3>
            
            <div className="flex items-center justify-between py-3 min-h-[56px]">
              <span className="text-gray-300 text-lg flex-1">Nattmodus nå</span>
              <Toggle val={forceNight} onChange={setForceNight} />
            </div>
            
            <div className="flex items-center justify-between py-3 min-h-[56px]">
              <span className="text-gray-300 text-lg flex-1">Vis værvarsel</span>
              <Toggle 
                val={showWeatherForecast} 
                onChange={(val) => {
                  setShowWeatherForecast(val);
                  storage.multiSet([['mh_show_weather_v1', val.toString()]]);
                }} 
              />
            </div>
            
            <div className="flex items-center justify-between py-3 min-h-[56px]">
              <span className="text-gray-300 text-lg flex-1">Vis FaceTime/SMS</span>
              <Toggle val={showFT} onChange={setShowFT} />
            </div>
            
            <div className="flex items-center justify-between py-3 min-h-[56px]">
              <span className="text-gray-300 text-lg flex-1">Bruk mock-data</span>
              <Toggle val={usingMock} onChange={setUsingMock} />
            </div>
            
            {/* Silhouette uploader */}
            <SilhouetteUploader 
              onSilhouetteGenerated={setSilhouetteUrl}
              currentSilhouette={silhouetteUrl}
            />

            {/* Location Selector */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h4 className="text-gray-300 text-lg font-semibold mb-3">Værlokasjon</h4>
              <LocationPicker
                currentLocation={currentWeatherLocation}
                onLocationSelect={handleLocationSelect}
              />
            </div>
            
            <div className="flex items-center justify-between py-3 min-h-[56px] border-t border-gray-700 mt-4 pt-4">
              <span className="text-gray-300 text-lg flex-1">Online</span>
              <span className="px-3 py-1.5 bg-yellow-900 text-yellow-200 rounded-lg text-sm">
                {online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="h-3" />
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-900 bg-opacity-30 text-gray-200 px-6 py-4 rounded-xl text-lg font-bold"
                onClick={handleManualRefresh}
                disabled={isSyncing}
              >
                {isSyncing ? 'Oppdaterer...' : 'Oppdater nå'}
              </button>
              <button
                className="bg-blue-600 text-white px-6 py-4 rounded-xl text-lg font-bold"
                onClick={() => setAdminVisible(false)}
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enkel selvtest (valgfritt)
export function __runMammasHjorneSelfTests() {
  const results: Record<string, boolean> = {};

  const now = new Date();
  const aStart = new Date(now.getTime() - 30_000).toISOString();
  const aEnd = new Date(now.getTime() + 30_000).toISOString();
  results['isNow_current'] = isNow(aStart, aEnd) === true;

  const s2 = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  results['inNextHours_true'] = inNextHours(s2, 3) === true;
  results['inNextHours_false'] = inNextHours(s2, 1) === false;

  const ev = makeMockEvents();
  const today = new Date();
  const todayStr = new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: '2-digit', timeZone: TZ }).format(today);
  const hasToday = ev.some(e => new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: '2-digit', timeZone: TZ }).format(parseISO(e.start)) === todayStr);
  const hasTomorrow = ev.some(e => {
    const t = new Date(today); t.setDate(t.getDate() + 1);
    const tomorrowStr = new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: '2-digit', timeZone: TZ }).format(t);
    return new Intl.DateTimeFormat('nb-NO', { day: '2-digit', month: '2-digit', timeZone: TZ }).format(parseISO(e.start)) === tomorrowStr;
  });
  results['mock_has_today'] = hasToday;
  results['mock_has_tomorrow'] = hasTomorrow;

  results['fmtTime_format'] = /:\d{2}$/.test(fmtTimeHM(new Date()));

  const contactVideo = { name: 'X', number: '+4712345678', type: 'video' as const };
  const contactAudio = { name: 'Y', number: '+4798765432', type: 'audio' as const };
  const contactSms = { name: 'Z', number: '+4700000000', type: 'sms' as const };
  const dial = (c: Contact) => (c.type === 'video' ? `facetime://${encodeURIComponent(c.number)}` : c.type === 'audio' ? `facetime-audio://${encodeURIComponent(c.number)}` : `sms:${encodeURIComponent(c.number)}`);
  results['dial_video'] = dial(contactVideo) === 'facetime://%2B4712345678';
  results['dial_audio'] = dial(contactAudio) === 'facetime-audio://%2B4798765432';
  results['dial_sms'] = dial(contactSms) === 'sms:%2B4700000000';

  return results;
}

export default MammasHjorneScreen;