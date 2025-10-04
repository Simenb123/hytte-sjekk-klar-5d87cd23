import type { GoogleEvent } from '@/types/googleCalendar.types';

const CACHE_KEY = 'googleCalendarCache';
const CACHE_EXPIRY_KEY = 'googleCalendarCacheExpiry';
const DEFAULT_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours (increased for better performance)
const STALE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for stale cache

interface CacheData {
  events: GoogleEvent[];
  timestamp: number;
  version: string;
}

export class GoogleCalendarCache {
  private static instance: GoogleCalendarCache;
  private version = '1.1'; // Updated version for stale-while-revalidate support

  static getInstance(): GoogleCalendarCache {
    if (!GoogleCalendarCache.instance) {
      GoogleCalendarCache.instance = new GoogleCalendarCache();
    }
    return GoogleCalendarCache.instance;
  }

  /**
   * Store events in cache with timestamp
   */
  storeEvents(events: GoogleEvent[]): boolean {
    try {
      const cacheData: CacheData = {
        events,
        timestamp: Date.now(),
        version: this.version
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + DEFAULT_CACHE_DURATION).toString());
      
      console.log(`📦 Cached ${events.length} Google Calendar events`);
      return true;
    } catch (error) {
      console.error('❌ Failed to cache Google Calendar events:', error);
      return false;
    }
  }

  /**
   * Retrieve events from cache if valid
   */
  getEvents(): GoogleEvent[] | null {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

      if (!cachedData || !expiry) {
        console.log('📦 No cached Google Calendar events found');
        return null;
      }

      const expiryTime = parseInt(expiry, 10);
      if (Date.now() > expiryTime) {
        console.log('📦 Cached Google Calendar events expired, clearing cache');
        this.clearCache();
        return null;
      }

      const cacheData: CacheData = JSON.parse(cachedData);
      
      // Version check
      if (cacheData.version !== this.version) {
        console.log('📦 Cache version mismatch, clearing cache');
        this.clearCache();
        return null;
      }

      console.log(`📦 Retrieved ${cacheData.events.length} cached Google Calendar events`);
      return cacheData.events;
    } catch (error) {
      console.error('❌ Failed to retrieve cached Google Calendar events:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Check if cache is valid and not expired
   */
  isValid(): boolean {
    try {
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      if (!expiry) return false;

      const expiryTime = parseInt(expiry, 10);
      return Date.now() <= expiryTime;
    } catch {
      return false;
    }
  }

  /**
   * Check if stale cache exists (older than fresh but still usable)
   */
  hasStaleCache(): boolean {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return false;

      const data: CacheData = JSON.parse(cachedData);
      const age = Date.now() - data.timestamp;
      
      // Stale cache is valid for up to 24 hours
      return age < STALE_CACHE_DURATION;
    } catch {
      return false;
    }
  }

  /**
   * Get stale events (for stale-while-revalidate pattern)
   */
  getStaleEvents(): GoogleEvent[] | null {
    if (this.hasStaleCache()) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;
        
        const data: CacheData = JSON.parse(cachedData);
        return data.events;
      } catch (error) {
        console.error('Failed to retrieve stale cache:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get cache age in minutes
   */
  getCacheAge(): number | null {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;

      const cacheData: CacheData = JSON.parse(cachedData);
      return Math.floor((Date.now() - cacheData.timestamp) / (1000 * 60));
    } catch {
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      console.log('📦 Google Calendar cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear Google Calendar cache:', error);
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo() {
    const events = this.getEvents();
    const age = this.getCacheAge();
    const isValid = this.isValid();

    return {
      hasCache: !!events,
      eventCount: events?.length || 0,
      ageMinutes: age,
      isValid,
      version: this.version
    };
  }
}

// Export singleton instance
export const googleCalendarCache = GoogleCalendarCache.getInstance();