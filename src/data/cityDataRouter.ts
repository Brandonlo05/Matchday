// ============================================================
// MatchDay — City Data Router
// Single source of truth for all city intelligence data.
// Add new city imports here as Gemini research completes.
// ============================================================

import { littleRockData } from './littleRockData';
import type { ProfileMatchTag } from './littleRockData';
import { nashvilleData } from './nashvilleData';

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

// ─── MINIMUM STRUCTURAL INTERFACE ────────────────────────────
// Covers exactly the fields read by the four city intelligence modules.
// Both littleRockData and nashvilleData are structural supertypes of this.

export interface CityIntelligenceData {
  restaurants: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    url: string;
    profileMatchTags: ProfileMatchTag[];
    historicalBadge: { active: boolean; copy: string | null };
    /** Populated for cities with richer data (Nashville+). Used for live deal countdowns. */
    deals?: {
      hasLunchSpecial: boolean;
      lunchHours: string | null;
      hasHappyHour: boolean;
      happyHourWindow: string | null;
    };
    /** Day-of-week hours map. Keys are lowercase day names. "Closed" means closed. */
    hours?: Record<string, string>;
  }>;
  transitOptions: ReadonlyArray<{
    id: string;
    name: string;
    category: 'Flash Rapid Selection' | 'Free / Public Selection';
    description: string;
    fare: string;
    /** Human-readable frequency string, e.g. "Every 10-15 minutes" or "On-demand". */
    frequency?: string;
  }>;
  sportsTeams: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    venue: string;
    ticketUrl: string | null;
    showLiveScore: boolean;
  }>;
  trails: ReadonlyArray<{
    id: string;
    name: string;
    tab: 'Top Trails' | 'Best Trails for Views';
    caption: string;
    mapsQuery: string;
    /** Named time bracket, e.g. "Sunrise", "Late Afternoon", "Sunset". */
    bestTimeToVisit?: string;
  }>;
}

// ─── CITY DATA MAP ───────────────────────────────────────────
// Add new city data files here once Gemini research is complete.

const cityDataMap: Partial<Record<SupportedCityKey, CityIntelligenceData>> = {
  'little-rock': littleRockData,
  'nashville':   nashvilleData,
  // 'miami':     miamiData,
};

// ─── LOOKUP FUNCTIONS ────────────────────────────────────────

/**
 * Returns the city data for an exact key match, or null if unsupported.
 */
export function getCityData(cityKey: string): CityIntelligenceData | null {
  const key = cityKey as SupportedCityKey;
  return cityDataMap[key] ?? null;
}

/**
 * Returns city data for the given key, falling back to the nearest
 * available city if the key has no data yet. Always returns data.
 */
export function getNearestAvailableCity(cityKey: string): {
  data: CityIntelligenceData;
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
