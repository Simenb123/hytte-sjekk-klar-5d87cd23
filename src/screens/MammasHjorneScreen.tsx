// MammasHjorneScreen.tsx
// --------------------------------------------------------------
// iPad-optimalisert infoskjerm for "Mammas hjørne" (React Native/Expo)
// Funksjoner: Stor dato/klokke (nb-NO), neste avtaler (i dag + i morgen),
// vær (nå + neste timer), nattmodus 01–07, offline-cache, nettstatus,
// skjult adminhjørne (PIN 2468), valgfri FaceTime/SMS-knapper, pixel-shift.
// Tidsone: Europe/Oslo, 24-timers klokke.
// --------------------------------------------------------------
// Koble til ekte data:
// 1) Events: prop `fetchEvents: () => Promise<Event[]>` kaller backend-endepunkt
//    (f.eks. GET /calendar/mamma/upcoming?days=2) og returnerer sorterte avtaler.
// 2) Vær: prop `fetchWeather: () => Promise<WeatherSnapshot>` fra YR-proxy.
// 3) Realtime: valgfri `initRealtime?: (onChange: () => void) => () => void`
//    som kobler Supabase-channel og kaller `onChange` ved endring.
// 4) Telemetry: `onHeartbeat?: (p: HeartbeatPayload) => void` hver 5. min.
// 5) Avhengigheter (Expo):
//    expo install @react-native-async-storage/async-storage @react-native-community/netinfo expo-keep-awake
// --------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, TextInput,
  Linking, ScrollView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useKeepAwake } from 'expo-keep-awake';

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
  now: { tempC: number; symbol: string; windMs?: number; feelsLikeC?: number };
  hourly: { timeISO: string; tempC: number; symbol: string }[]; // neste 6–12 timer
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
  fetchWeather?: () => Promise<WeatherSnapshot>;
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

const makeMockWeather = (): WeatherSnapshot => {
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
function EventRow({ ev }: { ev: Event }) {
  const s = parseISO(ev.start);
  const e = parseISO(ev.end);

  const badge = isNow(ev.start, ev.end)
    ? { label: 'Nå', color: '#16803C' }
    : inNextHours(ev.start, 3)
    ? { label: 'Snart', color: '#9B5B00' }
    : inNextHours(ev.start, 24)
    ? { label: 'I morgen', color: '#0B63A8' }
    : { label: 'Utover', color: '#666' };

  return (
    <View style={styles.eventRow}>
      <View style={[styles.badgePill, { backgroundColor: badge.color }]}>
        <Text style={styles.badgePillText}>{badge.label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventTitle}>{ev.title}</Text>
        <Text style={styles.eventMeta}>
          {fmtTimeHM(s)}–{fmtTimeHM(e)}
          {ev.location ? `  ·  ${ev.location}` : ''}
        </Text>
      </View>
    </View>
  );
}

function Toggle({ val, onChange }: { val: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: val }}
      onPress={() => onChange(!val)}
      style={[styles.toggle, val && styles.toggleOn]}
    >
      <View style={[styles.knob, val && styles.knobOn]} />
    </Pressable>
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
  useKeepAwake();

  // state-variabler
  const [events, setEvents] = useState<Event[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [usingMock, setUsingMock] = useState(!(fetchEvents && fetchWeather));

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
    const unsub = NetInfo.addEventListener((state) => setOnline(!!state.isConnected));
    return () => unsub();
  }, []);

  // last cache ved start
  useEffect(() => {
    (async () => {
      try {
        const [e, w, u] = await Promise.all([
          AsyncStorage.getItem(STORAGE_EVENTS),
          AsyncStorage.getItem(STORAGE_WEATHER),
          AsyncStorage.getItem(STORAGE_UPDATED_AT),
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
        we = makeMockWeather();
      } else {
        if (fetchEvents) ev = await fetchEvents();
        if (fetchWeather) we = await fetchWeather();
      }
      setEvents(ev);
      if (we) setWeather(we);
      const ts = new Date().toISOString();
      setLastUpdated(ts);
      await AsyncStorage.multiSet([
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
  }, [usingMock]);

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

  // ---------- Render ----------
  if (withinNight) {
    return (
      <View style={[styles.container, { backgroundColor: '#0b0b0f' }] }>
        <View
          style={[
            styles.nightBox,
            { transform: [{ translateX: shift.x }, { translateY: shift.y }] },
          ]}
        >
          <Text style={styles.nightTime}>{fmtTimeHM(now)}</Text>
          <Text style={styles.nightDate}>
            I dag er {fmtDateFull(now).replace(/^([a-zæøå]+)/i, (m) => m.toUpperCase())}
          </Text>
          {!online && <Text style={styles.badge}>Frakoblet</Text>}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { transform: [{ translateX: shift.x }, { translateY: shift.y }] },
      ]}
    >
      {/* skjult admin trigger */}
      <Pressable
        onPress={handleCornerTap}
        style={styles.cornerHotspot}
        accessibilityLabel="Skjult adminområde"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateLine}>
          I dag er{' '}
          {fmtDateFull(now).replace(/^([a-zæøå]+)/i, (m) => m.toUpperCase())}
        </Text>
        <Text style={styles.bigClock}>{fmtTimeHM(now)}</Text>
        <View style={styles.subHeaderRow}>
          <Text style={styles.updated}>
            Sist oppdatert {lastUpdated ? fmtTimeHM(parseISO(lastUpdated)) : '—'}
          </Text>
          {!online && (
            <Text style={[styles.badge, { marginLeft: 12 }]}>Frakoblet</Text>
          )}
        </View>
      </View>

      <View style={styles.contentRow}>
        {/* Vær */}
        <View style={styles.weatherCard}>
          <Text style={styles.sectionTitle}>Været</Text>
          <View style={styles.weatherNowRow}>
            <Text style={styles.weatherEmoji}>
              {symbolToEmoji(weather?.now.symbol ?? 'clearsky')}
            </Text>
            <View>
              <Text style={styles.weatherNowTemp}>
                {Math.round(weather?.now.tempC ?? 18)}°
              </Text>
              {typeof weather?.now.windMs === 'number' && (
                <Text style={styles.weatherDetails}>
                  Vind {weather?.now.windMs?.toFixed(1)} m/s
                </Text>
              )}
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {(weather?.hourly ?? makeMockWeather().hourly).map((h, idx) => (
              <View
                key={idx}
                style={[styles.weatherHour, idx !== 0 ? { marginLeft: 12 } : null]}
              >
                <Text style={styles.weatherHourTime}>
                  {fmtTimeHM(parseISO(h.timeISO))}
                </Text>
                <Text style={styles.weatherHourEmoji}>
                  {symbolToEmoji(h.symbol)}
                </Text>
                <Text style={styles.weatherHourTemp}>
                  {Math.round(h.tempC)}°
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Kalender */}
        <View style={[styles.eventsCard, { marginLeft: 16 }] }>
          <Text style={styles.sectionTitle}>Neste avtaler</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* I dag */}
            <Text style={styles.dayHeading}>I dag</Text>
            {grouped.evToday.length === 0 ? (
              <Text style={styles.emptyText}>Ingen avtaler i dag.</Text>
            ) : (
              grouped.evToday.map((ev) => <EventRow key={ev.id} ev={ev} />)
            )}

            {/* I morgen */}
            <Text style={[styles.dayHeading, { marginTop: 16 }]}>I morgen</Text>
            {grouped.evTomorrow.length === 0 ? (
              <Text style={styles.emptyText}>Ingen avtaler i morgen.</Text>
            ) : (
              grouped.evTomorrow.map((ev) => <EventRow key={ev.id} ev={ev} />)
            )}
          </ScrollView>
        </View>
      </View>

      {/* FaceTime/SMS-knapper */}
      {showFT && (
        <View style={styles.ftRow}>
          {contacts.map((c, i) => (
            <Pressable
              key={i}
              style={[styles.ftButton, i !== contacts.length - 1 && { marginRight: 12 }]}
              onPress={() =>
                Linking.openURL(dialHref(c) || '').catch(() => {})
              }
            >
              <Text style={styles.ftButtonText}>
                {c.type === 'video'
                  ? '🎥'
                  : c.type === 'audio'
                  ? '📞'
                  : '💬'}{' '}
                {c.name}
              </Text>
              {c.relation && (
                <Text style={styles.ftButtonSub}>{c.relation}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* PIN modal */}
      <Modal
        visible={adminArmed}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminArmed(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Skriv PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={(t) => {
                setPin(t.replace(/\D/g, '').slice(0, 8));
                if (pinError) setPinError('');
              }}
              placeholder="••••"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              secureTextEntry
              autoFocus
            />
            {!!pinError && <Text style={styles.pinError}>{pinError}</Text>}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => {
                  setAdminArmed(false);
                  setPin('');
                  setPinError('');
                }}
              >
                <Text style={styles.btnText}>Avbryt</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary, { marginLeft: 12 }]}
                onPress={verifyPin}
              >
                <Text style={[styles.btnText, { color: 'white' }]}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin-panel */}
      <Modal
        visible={adminVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAdminVisible(false)}
      >
        <View style={styles.adminBackdrop}>
          <View style={styles.adminPanel}>
            <Text style={styles.adminTitle}>Admin</Text>
            <View style={styles.adminRow}>
              <Text style={styles.adminLabel}>Nattmodus nå</Text>
              <Toggle val={forceNight} onChange={setForceNight} />
            </View>
            <View style={styles.adminRow}>
              <Text style={styles.adminLabel}>Vis FaceTime/SMS</Text>
              <Toggle val={showFT} onChange={setShowFT} />
            </View>
            <View style={styles.adminRow}>
              <Text style={styles.adminLabel}>Bruk mock-data</Text>
              <Toggle val={usingMock} onChange={setUsingMock} />
            </View>
            <View style={styles.adminRow}>
              <Text style={styles.adminLabel}>Online</Text>
              <Text style={[styles.badge, { alignSelf: 'auto' }]}>
                {online ? 'Online' : 'Offline'}
              </Text>
            </View>

            <View style={{ height: 12 }} />
            <View style={[styles.modalButtons, { justifyContent: 'flex-end' }] }>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => loadAll()}
              >
                <Text style={styles.btnText}>Oppdater nå</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary, { marginLeft: 12 }]}
                onPress={() => setAdminVisible(false)}
              >
                <Text style={[styles.btnText, { color: 'white' }]}>Lukk</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115', padding: 24, paddingTop: 16 },
  header: { marginBottom: 8 },
  dateLine: { fontSize: 28, color: '#E6E6EA', fontWeight: '600' },
  bigClock: { fontSize: 80, color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  updated: { fontSize: 16, color: '#9AA0A6' },
  badge: {
    fontSize: 14, color: '#FFD34D', backgroundColor: '#3A2E00',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },

  contentRow: { flex: 1, flexDirection: 'row', marginTop: 8 },

  weatherCard: { flex: 1, backgroundColor: '#171A21', borderRadius: 16, padding: 16 },
  eventsCard: { flex: 1.3, backgroundColor: '#171A21', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 22, color: '#FFFFFF', fontWeight: '700', marginBottom: 12 },

  weatherNowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  weatherEmoji: { fontSize: 48, marginRight: 12 },
  weatherNowTemp: { fontSize: 44, color: '#FFFFFF', fontWeight: '700' },
  weatherDetails: { fontSize: 16, color: '#BFC5CF' },
  weatherHour: {
    width: 82, backgroundColor: '#1F2430', borderRadius: 12,
    padding: 8, alignItems: 'center',
  },
  weatherHourTime: { fontSize: 16, color: '#C8CCD6' },
  weatherHourEmoji: { fontSize: 28, marginVertical: 6 },
  weatherHourTemp: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },

  dayHeading: { fontSize: 18, color: '#C8CCD6', marginBottom: 8, marginTop: 4 },
  emptyText: { fontSize: 18, color: '#9AA0A6' },

  eventRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2A2F3A',
  },
  eventTitle: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
  eventMeta: { fontSize: 16, color: '#9AA0A6', marginTop: 2 },

  badgePill: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: '#666', marginRight: 12,
  },
  badgePillText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },

  ftRow: { flexDirection: 'row', marginTop: 12 },
  ftButton: { backgroundColor: '#0B63A8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  ftButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  ftButtonSub: { color: 'white', fontSize: 14, opacity: 0.9 },

  nightBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nightTime: { fontSize: 120, color: '#DDE3EA', fontWeight: '700' },
  nightDate: { fontSize: 24, color: '#B0B6C0', marginTop: 8 },

  cornerHotspot: { position: 'absolute', top: 0, right: 0, width: 96, height: 96, zIndex: 20 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 420, maxWidth: '90%', backgroundColor: '#171A21', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 22, color: 'white', fontWeight: '700', marginBottom: 8 },
  pinInput: {
    backgroundColor: '#0f1115', color: 'white', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2F3A', paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 22, letterSpacing: 6, textAlign: 'center',
  },
  pinError: { color: '#FF7373', fontSize: 14, marginTop: 6 },
  modalButtons: { flexDirection: 'row', marginTop: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnGhost: { backgroundColor: '#00000030' },
  btnPrimary: { backgroundColor: '#0B63A8' },
  btnText: { color: '#E6E6EA', fontSize: 16, fontWeight: '700' },

  adminBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  adminPanel: { backgroundColor: '#171A21', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  adminTitle: { fontSize: 20, color: 'white', fontWeight: '800', marginBottom: 8 },
  adminRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  adminLabel: { color: '#C8CCD6', fontSize: 16 },

  toggle: { width: 56, height: 32, borderRadius: 999, backgroundColor: '#2A2F3A', padding: 4, justifyContent: 'center' },
  toggleOn: { backgroundColor: '#16803C' },
  knob: { width: 24, height: 24, borderRadius: 999, backgroundColor: '#9AA0A6', transform: [{ translateX: 0 }] },
  knobOn: { backgroundColor: '#fff', transform: [{ translateX: 24 }] },
});

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

