// ============================================================
// useFlash.ts
// The Flash recommendation engine.
// Builds a weighted candidate pool from pubs + freeActivities,
// filters by age tier and left-swipe suppression, and returns
// a single FlashResult per call.
// ============================================================

import { useCallback } from 'react';
import { CITIES } from './useMatchdayEngine';
import type { CityId, AgeTier, FlashResult, Pub, FreeActivity } from '../types';

// ─── Context reason bank (12 strings, keyed by time-of-day + category) ───────

const REASONS_MORNING = [
  'Perfect start before the afternoon crowd hits',
  "Still quiet — you'll have the place to yourself",
  'Locals come here before the tourists wake up',
  'Under 15 minutes from the stadium and worth every second',
];

const REASONS_AFTERNOON = [
  'Perfect window before the afternoon match',
  "Exactly the kind of spot you don't find on Google",
  'Local pick — tourists almost never end up here',
  'Under 15 minutes from the stadium and still has walk-in space',
];

const REASONS_EVENING = [
  'The energy here during match hours is unlike anywhere else',
  "Regulars have been coming here for years — tonight you're one of them",
  'Best ratio of atmosphere to elbow room in the city right now',
  "The kind of place that feels like a discovery even if it isn't",
];

const REASONS_LATE = [
  'Still open, still worth it, still the right call',
  "The last place standing that's actually good — don't overthink it",
  'Late night here beats early everywhere else',
  "You'll be back here tomorrow. Go tonight first.",
];

function getReasons(hour: number): string[] {
  if (hour < 12) return REASONS_MORNING;
  if (hour < 17) return REASONS_AFTERNOON;
  if (hour < 22) return REASONS_EVENING;
  return REASONS_LATE;
}

/** Seeded pseudo-random based on a string ID — deterministic per call */
function seededIndex(id: string, len: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % len;
}

// ─── Age-tier compatibility check ────────────────────────────────────────────

const BAR_KEYWORDS = ['bar', 'cocktail', 'brewery', 'pint', 'nightlife', 'club', 'lounge'];

function pubCompatible(pub: Pub, ageTier: AgeTier): boolean {
  if (ageTier === 'family') {
    const vibe = (pub.vibe ?? pub.tagline ?? '').toLowerCase();
    return !BAR_KEYWORDS.some((kw) => vibe.includes(kw));
  }
  return true;
}

function activityCompatible(act: FreeActivity, ageTier: AgeTier): boolean {
  if (ageTier === 'family') return act.minAge === 0;
  return true;
}

// ─── Time-of-day weights ──────────────────────────────────────────────────────

interface Pool {
  pubs: Pub[];
  activities: FreeActivity[];
}

function buildWeightedPool(pool: Pool, hour: number, ageTier: AgeTier): Array<{ item: Pub | FreeActivity; type: 'pub' | 'activity' }> {
  // Weight: before noon = 35% pub / 65% activity
  //         noon–5pm    = 55% pub / 45% activity
  //         5pm–10pm    = 70% pub / 30% activity
  //         after 10pm  = 85% pub (nightlife) / 15% activity
  let pubWeight = 0.55;
  let actWeight = 0.45;

  if (hour < 12) { pubWeight = 0.35; actWeight = 0.65; }
  else if (hour < 17) { pubWeight = 0.55; actWeight = 0.45; }
  else if (hour < 22) { pubWeight = 0.70; actWeight = 0.30; }
  else if (ageTier !== 'family') { pubWeight = 0.85; actWeight = 0.15; }

  const result: Array<{ item: Pub | FreeActivity; type: 'pub' | 'activity' }> = [];

  pool.pubs.forEach((pub) => {
    // Nightlife pubs weighted heavier after 10pm for adult tiers
    const isNightlife = BAR_KEYWORDS.some((kw) => (pub.vibe ?? '').toLowerCase().includes(kw));
    const mult = (hour >= 22 && ageTier !== 'family' && isNightlife) ? 2 : 1;
    for (let i = 0; i < mult; i++) result.push({ item: pub, type: 'pub' });
  });

  pool.activities.forEach((act) => {
    result.push({ item: act, type: 'activity' });
  });

  // Apply weights by duplicating proportionally
  const pubCount  = Math.round(result.filter((r) => r.type === 'pub').length  * pubWeight * 10);
  const actCount  = Math.round(result.filter((r) => r.type === 'activity').length * actWeight * 10);
  const weighted: typeof result = [];
  result.filter((r) => r.type === 'pub').forEach((r) => { for (let i = 0; i < Math.ceil(pubCount / pool.pubs.length || 1); i++) weighted.push(r); });
  result.filter((r) => r.type === 'activity').forEach((r) => { for (let i = 0; i < Math.ceil(actCount / Math.max(pool.activities.length, 1)); i++) weighted.push(r); });

  return weighted.length > 0 ? weighted : result;
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useFlash() {
  const getFlash = useCallback(
    (
      cityKey: CityId,
      ageTier: AgeTier,
      excludeIds: string[],
      sessionIndex: number = 0
    ): FlashResult | null => {
      const city = CITIES.find((c) => c.id === cityKey);
      if (!city) return null;

      const hour = new Date().getHours();

      // Filter candidates
      const eligiblePubs = city.pubs.filter(
        (p) => !excludeIds.includes(p.id) && pubCompatible(p, ageTier)
      );
      const eligibleActivities = city.freeActivities.filter(
        (a) => !excludeIds.includes(a.id) && activityCompatible(a, ageTier)
      );

      if (eligiblePubs.length === 0 && eligibleActivities.length === 0) return null;

      // Build weighted pool
      const pool = buildWeightedPool(
        { pubs: eligiblePubs, activities: eligibleActivities },
        hour,
        ageTier
      );

      if (pool.length === 0) return null;

      // Select using session index for deterministic rotation
      const candidate = pool[(sessionIndex) % pool.length];
      const reasons = getReasons(hour);

      if (candidate.type === 'pub') {
        const pub = candidate.item as Pub;
        const reasonIdx = seededIndex(pub.id + sessionIndex, reasons.length);
        return {
          id: pub.id,
          name: pub.name,
          type: 'pub',
          category: pub.features[0] ?? 'sports_bar',
          distanceLabel: pub.distanceKm != null
            ? `${pub.distanceKm.toFixed(1)} km away`
            : pub.neighborhood,
          contextReason: reasons[reasonIdx],
          primaryActionLabel: 'Reserve My Spot →',
          primaryActionUrl: `pub://${pub.id}`,
          vibeOrDescription: pub.tagline,
        };
      } else {
        const act = candidate.item as FreeActivity;
        const reasonIdx = seededIndex(act.id + sessionIndex, reasons.length);
        return {
          id: act.id,
          name: act.name,
          type: 'activity',
          category: act.category,
          distanceLabel: act.distance,
          contextReason: reasons[reasonIdx],
          primaryActionLabel: 'Open in Maps →',
          primaryActionUrl: `https://maps.google.com/?q=${encodeURIComponent(act.mapsQuery)}`,
          vibeOrDescription: act.description,
        };
      }
    },
    []
  );

  return { getFlash };
}
