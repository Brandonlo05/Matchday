// ============================================================
// useHistoricalPulse.ts
// Passive ambient feature. Watches user position and fires a
// native Notification when they step within 150ft (45.7m) of a
// historical pin for the active city.
//
// Rules:
// · Fires at most once per pin per session (sessionStorage guard)
// · Suppresses notifications if movement speed > 1.4 m/s
// · Fails silently — no errors surface to the user
// · Restarts automatically when cityKey changes
// ============================================================

import { useEffect, useRef } from 'react';
import { HISTORICAL_PINS } from '../data/historicalPins';
import type { CityId } from '../types';

const TRIGGER_RADIUS_M = 45.7;  // 150 feet
const MAX_SPEED_MS     = 1.4;   // m/s — brisk walking pace
const SESSION_KEY      = 'mds_fired_pins';

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; // metres
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getFiredSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markFired(pinId: string): void {
  try {
    const set = getFiredSet();
    set.add(pinId);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
  } catch {}
}

export function useHistoricalPulse(cityKey: CityId): void {
  const watchIdRef     = useRef<number | null>(null);
  const lastPosRef     = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    // Clear watch on city change
    if (watchIdRef.current !== null) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
      watchIdRef.current = null;
    }

    // Request notification permission — fail silently if denied
    if (!('Notification' in window) || !navigator.geolocation) return;
    if (Notification.permission === 'denied') return;

    const cityPins = HISTORICAL_PINS.filter((p) => p.cityKey === cityKey);
    if (cityPins.length === 0) return;

    function onPosition(pos: GeolocationPosition) {
      const { latitude: lat, longitude: lng } = pos.coords;
      const now = pos.timestamp;

      // Speed suppression
      if (lastPosRef.current) {
        const dist = haversineM(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng);
        const dt   = (now - lastPosRef.current.time) / 1000; // seconds
        if (dt > 0 && dist / dt > MAX_SPEED_MS) {
          lastPosRef.current = { lat, lng, time: now };
          return; // moving too fast — commuting, skip
        }
      }
      lastPosRef.current = { lat, lng, time: now };

      const fired = getFiredSet();

      for (const pin of cityPins) {
        if (fired.has(pin.id)) continue;
        const dist = haversineM(lat, lng, pin.lat, pin.lng);
        if (dist <= TRIGGER_RADIUS_M) {
          try {
            new Notification(pin.title, {
              body: pin.body,
              icon: '/pwa-192x192.png',
            });
          } catch {}
          markFired(pin.id);
        }
      }
    }

    function startWatch() {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onPosition,
        () => {}, // fail silently
        { enableHighAccuracy: true, maximumAge: 10_000 }
      );
    }

    if (Notification.permission === 'granted') {
      startWatch();
    } else {
      Notification.requestPermission()
        .then((perm) => { if (perm === 'granted') startWatch(); })
        .catch(() => {}); // fail silently
    }

    return () => {
      if (watchIdRef.current !== null) {
        try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
        watchIdRef.current = null;
      }
    };
  }, [cityKey]);
}
