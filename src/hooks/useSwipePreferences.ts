// ============================================================
// useSwipePreferences.ts
// Manages swipe history and saved places for the Flash engine.
// Writes to localStorage under mds_swipe_history / mds_saved_places.
// After every 5 right swipes: sets mds_preferences_trained = true.
// ============================================================

import { useState, useCallback } from 'react';
import type { SwipeRecord, CityId } from '../types';

const LS_HISTORY = 'mds_swipe_history';
const LS_SAVED   = 'mds_saved_places';
const LS_TRAINED = 'mds_preferences_trained';

function readHistory(): SwipeRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
  } catch {
    return [];
  }
}

function readSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SAVED) || '[]');
  } catch {
    return [];
  }
}

export function useSwipePreferences() {
  const [history, setHistory] = useState<SwipeRecord[]>(readHistory);
  const [swipeCount, setSwipeCount] = useState<number>(() =>
    readHistory().filter((r) => r.direction === 'right').length
  );

  const recordSwipe = useCallback(
    (id: string, direction: 'left' | 'right', type: 'pub' | 'activity', cityKey: CityId) => {
      const record: SwipeRecord = {
        id,
        direction,
        type,
        cityKey,
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => {
        const updated = [...prev, record];
        try { localStorage.setItem(LS_HISTORY, JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (direction === 'right') {
        // Save to saved places
        const saved = readSaved();
        if (!saved.includes(id)) {
          const updated = [...saved, id];
          try { localStorage.setItem(LS_SAVED, JSON.stringify(updated)); } catch {}
        }

        // Update count + check trained threshold
        setSwipeCount((prev) => {
          const next = prev + 1;
          if (next % 5 === 0) {
            try { localStorage.setItem(LS_TRAINED, 'true'); } catch {}
          }
          return next;
        });
      }
    },
    []
  );

  const getSavedPlaces = useCallback((): string[] => readSaved(), []);

  const getLeftSwipedIds = useCallback((): string[] => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // last 24 hours
    return history
      .filter((r) => r.direction === 'left' && new Date(r.timestamp).getTime() > cutoff)
      .map((r) => r.id);
  }, [history]);

  return {
    recordSwipe,
    getSavedPlaces,
    getLeftSwipedIds,
    swipeCount,
  };
}
