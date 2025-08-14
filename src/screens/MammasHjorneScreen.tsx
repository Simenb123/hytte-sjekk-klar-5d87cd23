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
  now: { tempC: number; symbol: string; windMs?: number; feelsLikeC?: number };
  hourly: { timeISO: string; tempC: number; symbol: string }[]; // neste 6–12 timer
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

// For demo: ikon→emoji; kan erstattes med YR-ikoner
const symbolToEmoji = (s: string): string => {
  const key = s.toLowerCase();
  if (key.includes('snow')) return '❄️';
  if (key.includes('rain') || key.includes('regn')) return '🌧️';
  if (key.includes('cloud') || key.includes('sky')) return '☁️';
  if (key.includes('thunder') || key.includes('torden')) return '⛈️';
  if (key.includes('fog') || key.includes('tåke')) return '🌫️';
  if (key.includes('sun') || key.includes('klar')) return '☀️';
  return '🌤️';
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

const parseISO = (s: string) => new Date(s);

const isNight = (d: Date) => {
  const h = Number(
    new Intl.DateTimeFormat('nb-NO', {
      hour: 'numeric',
      hour12: false,
      timeZone: TZ,
    }).format(d),
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
      <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center overflow-hidden">
        <img 
          src="/lovable-uploads/3d8c6965-c80d-4939-82fe-1571dd5475fc.png" 
          alt="Mamma profil ikon" 
          className="w-10 h-10 object-cover"
        />
      </div>
      <span className="text-lg font-bold text-white">Mamma's hjørne</span>
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

function EventRow({ ev }: { ev: Event }) {
  const s = parseISO(ev.start);
  const e = parseISO(ev.end);

  const badge = isNow(ev.start, ev.end)
    ? { label: 'Nå', cssClass: 'bg-green-600' }
    : inNextHours(ev.start, 3)
    ? { label: 'Snart', cssClass: 'bg-orange-600' }
    : inNextHours(ev.start, 24)
    ? { label: 'I morgen', cssClass: 'bg-blue-600' }
    : { label: 'Utover', cssClass: 'bg-gray-600' };

  return (
    <div className="flex items-center gap-3 py-4 border-b border-gray-700 min-h-[80px]">
      <div className={`px-3.5 py-2 rounded-full text-xs text-white font-bold min-w-[80px] text-center ${badge.cssClass}`}>
        {badge.label}
      </div>
      <div className="flex-1">
        <div className="text-white font-semibold text-xl leading-7">{ev.title}</div>
        <div className="text-gray-400 text-lg mt-1 leading-6">
          {fmtTimeHM(s)}–{fmtTimeHM(e)}
          {ev.location ? `  ·  ${ev.location}` : ''}
        </div>
      </div>
    </div>
  );
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
}) => {

  // Lokasjoner for værvarsel
  const weatherLocations: WeatherLocation[] = [
    { name: 'Gaustablikk', lat: 59.8726, lon: 8.6475 },
    { name: 'Jeløya (Moss)', lat: 59.4, lon: 10.6 },
  ];

  // state-variabler
  const [events, setEvents] = useState<Event[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [usingMock, setUsingMock] = useState(!(fetchEvents && fetchWeather));
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>(weatherLocations[0]);
  const [silhouetteUrl, setSilhouetteUrl] = useState<string | null>(null);

  const [adminVisible, setAdminVisible] = useState(false);
  const [adminArmed, setAdminArmed] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [forceNight, setForceNight] = useState(false);
  const [showFT, setShowFT] = useState(showFaceTime);

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
        const [e, w, u] = await Promise.all([
          storage.getItem(STORAGE_EVENTS),
          storage.getItem(STORAGE_WEATHER),
          storage.getItem(STORAGE_UPDATED_AT),
        ]);
        if (e) setEvents(JSON.parse(e));
        if (w) setWeather(JSON.parse(w));
        if (u) setLastUpdated(u);
      } catch { /* empty */ }
    })();
  }, []);

  // polling + realtime
  const loadAll = async () => {
    try {
      let ev = events;
      let we = weather;
      if (usingMock) {
        ev = makeMockEvents();
        we = makeMockWeather(selectedLocation.name);
      } else {
        if (fetchEvents) ev = await fetchEvents();
        if (fetchWeather) we = await fetchWeather(selectedLocation.lat, selectedLocation.lon);
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
      // beholder cache
    }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, POLL_MS);

    let unsub: undefined | (() => void);
    if (initRealtime) {
      try {
        unsub = initRealtime(() => loadAll());
      } catch { /* empty */ }
    }
    return () => {
      clearInterval(t);
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingMock, selectedLocation]);

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

  // grouping
  const grouped = useMemo(() => {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

    const evToday: Event[] = [];
    const evTomorrow: Event[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    events.forEach((ev) => {
      const s = parseISO(ev.start);
      if (isSameDay(s, today)) evToday.push(ev);
      else if (isSameDay(s, tomorrow)) evTomorrow.push(ev);
    });

    const sortByStart = (a: Event, b: Event) =>
      parseISO(a.start).getTime() - parseISO(b.start).getTime();

    evToday.sort(sortByStart);
    evTomorrow.sort(sortByStart);
    return { evToday, evTomorrow };
  }, [events]);

  const withinNight = forceNight || isNight(now);

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
      className="flex-1 bg-gray-950 p-8 pt-6 w-full min-h-screen"
      style={{ transform: `translate(${shift.x}px, ${shift.y}px)` }}
    >
      {/* skjult admin trigger */}
      <button
        onClick={handleCornerTap}
        className="absolute top-0 right-0 w-30 h-30 z-20 opacity-0"
        aria-label="Skjult adminområde"
      />

      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-4xl text-gray-200 font-semibold leading-10 mb-2">
              I dag er det{' '}
              {fmtDateFull(now).replace(/^([a-zæøå]+)/i, (m) => m.toUpperCase())}
            </div>
            <div className="text-8xl text-white font-bold tracking-wide leading-none mb-2">
              {fmtTimeHM(now)}
            </div>
            <div className="flex items-center gap-3 min-h-7">
              <span className="text-lg text-gray-400">
                Sist oppdatert {lastUpdated ? fmtTimeHM(parseISO(lastUpdated)) : '—'}
              </span>
              {!online && (
                <span className="px-3 py-1.5 bg-yellow-900 text-yellow-200 rounded-lg text-sm font-medium">
                  Frakoblet
                </span>
              )}
            </div>
          </div>
          <div className="ml-8">
            <MammasLogo silhouetteUrl={silhouetteUrl} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 mt-5">
        {/* Vær */}
        <div className="flex-1 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-8 min-h-[400px] backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl text-white font-bold tracking-wide">Været</h2>
            <LocationDropdown 
              locations={weatherLocations}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
          </div>
          <div className="text-blue-200 text-xl mb-8 font-medium">{weather?.locationName || selectedLocation.name}</div>
          
          {/* Current weather card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-8xl drop-shadow-lg">
                  {symbolToEmoji(weather?.now.symbol ?? 'clearsky')}
                </div>
                <div>
                  <div className="text-7xl text-white font-bold leading-none mb-2">
                    {Math.round(weather?.now.tempC ?? 18)}°
                  </div>
                  <div className="text-blue-200 text-lg">Nå</div>
                </div>
              </div>
              {typeof weather?.now.windMs === 'number' && (
                <div className="text-right">
                  <div className="text-blue-200 text-lg mb-1">Vind</div>
                  <div className="text-white text-2xl font-semibold">
                    {weather?.now.windMs?.toFixed(1)} m/s
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Hourly forecast */}
          <div className="mt-4">
            <h3 className="text-blue-200 text-xl font-semibold mb-4">Neste timer</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {(weather?.hourly ?? makeMockWeather().hourly).map((h, idx) => (
                <div
                  key={idx}
                  className="min-w-[100px] bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="text-blue-200 text-sm font-medium mb-2">
                    {fmtTimeHM(parseISO(h.timeISO))}
                  </div>
                  <div className="text-4xl mb-2 drop-shadow-sm">
                    {symbolToEmoji(h.symbol)}
                  </div>
                  <div className="text-xl text-white font-bold">
                    {Math.round(h.tempC)}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kalender */}
        <div className="flex-[1.3] bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-600/30 rounded-2xl p-8 min-h-[400px] backdrop-blur-sm">
          <h2 className="text-3xl text-white font-bold mb-4 leading-8">Neste avtaler</h2>
          <div className="overflow-y-auto pb-6">
            {/* I dag */}
            <h3 className="text-2xl text-gray-300 mb-3 mt-2 font-semibold">I dag</h3>
            {grouped.evToday.length === 0 ? (
              <div className="text-xl text-gray-400 leading-7">Ingen avtaler i dag.</div>
            ) : (
              grouped.evToday.map((ev) => <EventRow key={ev.id} ev={ev} />)
            )}

            {/* I morgen */}
            <h3 className="text-2xl text-gray-300 mb-3 mt-4 font-semibold">I morgen</h3>
            {grouped.evTomorrow.length === 0 ? (
              <div className="text-xl text-gray-400 leading-7">Ingen avtaler i morgen.</div>
            ) : (
              grouped.evTomorrow.map((ev) => <EventRow key={ev.id} ev={ev} />)
            )}
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
            
            <div className="flex items-center justify-between py-3 min-h-[56px]">
              <span className="text-gray-300 text-lg flex-1">Online</span>
              <span className="px-3 py-1.5 bg-yellow-900 text-yellow-200 rounded-lg text-sm">
                {online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="h-3" />
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-900 bg-opacity-30 text-gray-200 px-6 py-4 rounded-xl text-lg font-bold"
                onClick={() => loadAll()}
              >
                Oppdater nå
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