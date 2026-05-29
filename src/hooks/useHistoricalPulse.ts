import { useEffect, useRef } from 'react';

import { HISTORICAL_PINS } from '../data/historicalPins';
import type { CityKey } from '../types';

const FIRED_KEY = 'mds_fired_pins';
const RADIUS_M = 45.7;
const SPEED_LIMIT_MPS = 1.4;

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readFiredSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeFiredSet(set: Set<string>): void {
  try {
    sessionStorage.setItem(FIRED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function useHistoricalPulse(cityKey: CityKey) {
  const watchIdRef = useRef<number | null>(null);
  const lastPositionsRef = useRef<{ lat: number; lng: number; t: number }[]>([]);
  const firedRef = useRef<Set<string>>(readFiredSet());

  useEffect(() => {
    firedRef.current = readFiredSet();

    if (!('Notification' in window) || !navigator.geolocation) return;

    let cancelled = false;

    async function start() {
      try {
        const permission = await Notification.requestPermission();
        if (cancelled || permission !== 'granted') return;
      } catch {
        return;
      }

      const pins = HISTORICAL_PINS.filter((p) => p.cityKey === cityKey);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const now = pos.timestamp;

          const history = lastPositionsRef.current;
          history.push({ lat, lng, t: now });
          if (history.length > 2) history.shift();

          if (history.length === 2) {
            const [a, b] = history;
            const dt = (b.t - a.t) / 1000;
            if (dt > 0) {
              const dist = haversineM(a.lat, a.lng, b.lat, b.lng);
              if (dist / dt > SPEED_LIMIT_MPS) return;
            }
          }

          for (const pin of pins) {
            const dist = haversineM(lat, lng, pin.lat, pin.lng);
            if (dist > RADIUS_M) continue;
            if (firedRef.current.has(pin.id)) continue;

            try {
              new Notification(pin.title, {
                body: pin.body,
                icon: '/icon-192.png',
              });
              firedRef.current.add(pin.id);
              writeFiredSet(firedRef.current);
            } catch {
              /* silent */
            }
          }
        },
        () => {
          /* denied — silent */
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 },
      );
    }

    start();

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [cityKey]);
}
