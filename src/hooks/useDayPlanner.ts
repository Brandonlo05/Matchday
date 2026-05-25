// ============================================================
// useDayPlanner.ts
// Zero-input full-day itinerary generator.
// 4 time brackets × 3 rotating templates per city.
// Late Night slot replaced with family-safe alternative for family tier.
// ============================================================

import { useState, useCallback } from 'react';
import { CITIES } from './useMatchdayEngine';
import type { CityId, AgeTier, DayPlan, PlanSlot, Pub, FreeActivity } from '../types';

// ─── Time bracket labels ──────────────────────────────────────

const BRACKETS = [
  { id: 'morning',   timeLabel: 'Morning',    timeEmoji: '🌅', start: 6,  end: 11 },
  { id: 'afternoon', timeLabel: 'Afternoon',  timeEmoji: '☀️',  start: 11, end: 16 },
  { id: 'evening',   timeLabel: 'Evening',    timeEmoji: '🌆', start: 16, end: 21 },
  { id: 'late',      timeLabel: 'Late Night', timeEmoji: '🌙', start: 21, end: 6  },
];

// ─── Template rotation — day of week mod 3 ───────────────────

function templateIndex(): number {
  return new Date().getDay() % 3;
}

// ─── Build slot from pub ──────────────────────────────────────

function pubSlot(bracketId: string, pub: Pub): PlanSlot {
  const hour = new Date().getHours();
  const past = {
    morning:   hour >= 11,
    afternoon: hour >= 16,
    evening:   hour >= 21,
    late:      false,
  }[bracketId] ?? false;

  return {
    id: `${bracketId}-${pub.id}`,
    timeLabel:   BRACKETS.find((b) => b.id === bracketId)?.timeLabel ?? bracketId,
    timeEmoji:   BRACKETS.find((b) => b.id === bracketId)?.timeEmoji ?? '📍',
    name:        pub.name,
    type:        'pub',
    description: pub.tagline,
    actionLabel: 'Reserve →',
    actionUrl:   `pub://${pub.id}`,
    swappable:   past,
  };
}

// ─── Build slot from activity ─────────────────────────────────

function activitySlot(bracketId: string, act: FreeActivity): PlanSlot {
  const hour = new Date().getHours();
  const past = {
    morning:   hour >= 11,
    afternoon: hour >= 16,
    evening:   hour >= 21,
    late:      false,
  }[bracketId] ?? false;

  return {
    id: `${bracketId}-${act.id}`,
    timeLabel:   BRACKETS.find((b) => b.id === bracketId)?.timeLabel ?? bracketId,
    timeEmoji:   BRACKETS.find((b) => b.id === bracketId)?.timeEmoji ?? '📍',
    name:        act.name,
    type:        'activity',
    description: act.description,
    actionLabel: 'Get Directions →',
    actionUrl:   `https://maps.google.com/?q=${encodeURIComponent(act.mapsQuery)}`,
    swappable:   past,
  };
}

// ─── Build 4-slot plan ────────────────────────────────────────

function buildPlan(cityKey: CityId, ageTier: AgeTier, tplIdx: number): PlanSlot[] {
  const city = CITIES.find((c) => c.id === cityKey);
  if (!city) return [];

  const pubs = city.pubs;
  const cityName = city.displayName;
  const acts = city.freeActivities.filter((a) => ageTier === 'family' ? a.minAge === 0 : true);
  const familySafeActs = city.freeActivities.filter((a) => a.minAge === 0);

  // 3 templates, each with [morning, afternoon, evening, late] selections
  // Template uses modular indexing into pubs/activities arrays
  const templates: Array<[string, string, string, string]> = [
    ['activity-0', 'activity-1', 'pub-0', 'pub-1'],
    ['activity-2', 'pub-0',      'pub-1', 'pub-2'],
    ['pub-0',      'activity-0', 'pub-1', 'activity-1'],
  ];

  const tpl = templates[tplIdx % 3];

  function resolve(key: string, bracket: string): PlanSlot {
    const [kind, idxStr] = key.split('-');
    const idx = parseInt(idxStr, 10);

    if (kind === 'pub') {
      const pub = pubs[idx % pubs.length];
      if (pub) return pubSlot(bracket, pub);
    }

    if (kind === 'activity') {
      // For late night with family tier, force a family-safe activity
      const pool = (bracket === 'late' && ageTier === 'family') ? familySafeActs : acts;
      const act = pool[idx % Math.max(pool.length, 1)];
      if (act) return activitySlot(bracket, act);
    }

    // Fallback
    const fallback = acts[0];
    if (fallback) return activitySlot(bracket, fallback);
    return activitySlot(bracket, {
      id: 'fallback', name: 'Explore the city', category: 'landmark',
      distance: 'Nearby', description: 'Take a walk and discover something new.',
      tip: 'The best discoveries are unplanned.', isFamilyFriendly: true,
      minAge: 0, mapsQuery: cityName,
    });
  }

  const brackets = ['morning', 'afternoon', 'evening', 'late'];

  return brackets.map((bracket, i) => {
    let slot = resolve(tpl[i], bracket);

    // For family tier late night: ensure it's an activity, not a bar
    if (bracket === 'late' && ageTier === 'family' && slot.type === 'pub') {
      const safeAct = familySafeActs[i % Math.max(familySafeActs.length, 1)];
      if (safeAct) {
        slot = { ...activitySlot('late', safeAct), timeLabel: 'Evening Wind-Down', timeEmoji: '🌇' };
      }
    }

    return slot;
  });
}

// ─── Hook ────────────────────────────────────────────────────

export function useDayPlanner(cityKey: CityId, ageTier: AgeTier) {
  const tplIdx = templateIndex();
  const city = CITIES.find((c) => c.id === cityKey);

  const initialSlots = buildPlan(cityKey, ageTier, tplIdx);
  const [slots, setSlots] = useState<PlanSlot[]>(initialSlots);

  // Called when city changes
  const resetForCity = useCallback((newCityKey: CityId) => {
    setSlots(buildPlan(newCityKey, ageTier, tplIdx));
  }, [ageTier, tplIdx]);

  /** Swap a single slot to the next available item in its bracket */
  const swapSlot = useCallback((slotId: string) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.id === slotId);
      if (idx === -1) return prev;

      const bracket = slotId.split('-')[0];
      const city2 = CITIES.find((c) => c.id === cityKey);
      if (!city2) return prev;

      const currentName = prev[idx].name;
      const pubs = city2.pubs.filter((p) => p.name !== currentName);
      const acts = city2.freeActivities.filter(
        (a) => (ageTier === 'family' ? a.minAge === 0 : true) && a.name !== currentName
      );

      // Cycle: current type → try other type → cycle back
      const current = prev[idx];
      let newSlot: PlanSlot;

      if (current.type === 'pub' && acts.length > 0) {
        const act = acts[idx % acts.length];
        newSlot = activitySlot(bracket, act);
      } else if (current.type === 'activity' && pubs.length > 0) {
        const pub = pubs[idx % pubs.length];
        // Respect family-safe for late
        if (bracket === 'late' && ageTier === 'family') {
          const safeAct = acts[idx % Math.max(acts.length, 1)];
          if (safeAct) {
            newSlot = { ...activitySlot('late', safeAct), timeLabel: 'Evening Wind-Down', timeEmoji: '🌇' };
          } else {
            return prev;
          }
        } else {
          newSlot = pubSlot(bracket, pub);
        }
      } else {
        return prev; // nothing to swap to
      }

      const updated = [...prev];
      updated[idx] = newSlot;
      return updated;
    });
  }, [cityKey, ageTier]);

  const plan: DayPlan = {
    cityName: city?.displayName ?? cityKey,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    slots,
  };

  return { plan, swapSlot, resetForCity };
}
