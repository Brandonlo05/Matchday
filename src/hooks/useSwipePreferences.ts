import { useCallback, useMemo, useState } from 'react';

import type { CityKey, FlashItemType, SavedPlace, SwipeRecord } from '../types';

const HISTORY_KEY = 'mds_swipe_history';
const SAVED_KEY = 'mds_saved_places';
const TRAINED_KEY = 'mds_preferences_trained';

function readHistory(): SwipeRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SwipeRecord[]) : [];
  } catch {
    return [];
  }
}

function readSaved(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedPlace[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(records: SwipeRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

function writeSaved(places: SavedPlace[]): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(places.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function useSwipePreferences() {
  const [history, setHistory] = useState<SwipeRecord[]>(readHistory);
  const [saved, setSaved] = useState<SavedPlace[]>(readSaved);

  const swipeCount = useMemo(
    () => history.filter((r) => r.direction === 'right').length,
    [history],
  );

  const recordSwipe = useCallback(
    (
      id: string,
      direction: 'left' | 'right',
      type: FlashItemType,
      cityKey: CityKey,
      name: string,
    ) => {
      const record: SwipeRecord = {
        id,
        direction,
        type,
        cityKey,
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => {
        const next = [record, ...prev];
        writeHistory(next);

        const rightCount = next.filter((r) => r.direction === 'right').length;
        if (rightCount > 0 && rightCount % 5 === 0) {
          try {
            localStorage.setItem(TRAINED_KEY, 'true');
          } catch {
            /* ignore */
          }
        }

        return next;
      });

      if (direction === 'right') {
        setSaved((prev) => {
          if (prev.some((p) => p.id === id)) return prev;
          const place: SavedPlace = {
            id,
            name,
            type,
            cityKey,
            savedAt: new Date().toISOString(),
          };
          const next = [place, ...prev];
          writeSaved(next);
          return next;
        });
      }
    },
    [],
  );

  const getSavedPlaces = useCallback(() => saved, [saved]);

  const getLeftSwipedIds = useCallback(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return new Set(
      history
        .filter(
          (r) =>
            r.direction === 'left' &&
            new Date(r.timestamp).getTime() > cutoff,
        )
        .map((r) => r.id),
    );
  }, [history]);

  const preferencesTrained = useMemo(() => {
    try {
      return localStorage.getItem(TRAINED_KEY) === 'true';
    } catch {
      return false;
    }
  }, [swipeCount]);

  return {
    recordSwipe,
    getSavedPlaces,
    getLeftSwipedIds,
    swipeCount,
    preferencesTrained,
  };
}
