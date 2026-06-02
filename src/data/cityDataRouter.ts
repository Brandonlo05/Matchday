// ============================================================
// MatchDay — City Data Router
// Single source of truth for all city intelligence data.
// Add new city imports here as Gemini research completes.
// ============================================================

import { littleRockData } from './littleRockData';

// ─── SUPPORTED CITY KEYS ─────────────────────────────────────

export type SupportedCityKey =
  | 'la'
  | 'cdmx'
  | 'toronto'
  | 'ny'
  | 'little-rock'
  | 'nashville'
  | 'miami'
  | 'austin'
  | 'chicago'
  | 'new-orleans'
  | 'atlanta'
  | 'dallas'
  | 'denver'
  | 'seattle'
  | 'boston';

// ─── CITY DATA MAP ───────────────────────────────────────────
// Add new city data files here once Gemini research is complete.

const cityDataMap: Partial<Record<SupportedCityKey, typeof littleRockData>> = {
  'little-rock': littleRockData,
  // 'nashville': nashvilleData,
  // 'miami':     miamiData,
};

// ─── LOOKUP FUNCTIONS ────────────────────────────────────────

/**
 * Returns the city data for an exact key match, or null if unsupported.
 */
export function getCityData(
  cityKey: string,
): typeof littleRockData | null {
  const key = cityKey as SupportedCityKey;
  return cityDataMap[key] ?? null;
}

/**
 * Returns city data for the given key, falling back to the nearest
 * available city if the key has no data yet. Always returns data.
 */
export function getNearestAvailableCity(cityKey: string): {
  data: typeof littleRockData;
  resolvedKey: string;
  isExact: boolean;
} {
  const exact = getCityData(cityKey);
  if (exact !== null) {
    return { data: exact, resolvedKey: cityKey, isExact: true };
  }
  // Default to Little Rock until the full city roster is populated.
  // Replace with distance-based nearest city once more data files land.
  return {
    data: littleRockData,
    resolvedKey: 'little-rock',
    isExact: false,
  };
}
