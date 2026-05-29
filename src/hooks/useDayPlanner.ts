import { useCallback, useEffect, useState } from 'react';

import { CITIES } from './useMatchdayEngine';
import type { AgeTier, CityKey, DayPlan, FlashItemType, FreeActivity, PlanSlot, Pub } from '../types';

type Bracket = 'morning' | 'afternoon' | 'evening' | 'late';

const BRACKET_META: Record<Bracket, { timeLabel: string; timeEmoji: string; start: number; end: number }> = {
  morning: { timeLabel: 'Morning', timeEmoji: '🌅', start: 6, end: 11 },
  afternoon: { timeLabel: 'Afternoon', timeEmoji: '☀️', start: 11, end: 16 },
  evening: { timeLabel: 'Evening', timeEmoji: '🌆', start: 16, end: 21 },
  late: { timeLabel: 'Late Night', timeEmoji: '🌙', start: 21, end: 24 },
};

const NIGHTLIFE_WORDS = ['bar', 'cocktail', 'brewery', 'pint', 'nightlife'];

function isNightlifePub(pub: Pub): boolean {
  const text = `${pub.name} ${pub.tagline} ${pub.features.join(' ')}`.toLowerCase();
  return NIGHTLIFE_WORDS.some((w) => text.includes(w));
}

function slotFromPub(pub: Pub, bracket: Bracket): PlanSlot {
  const meta = BRACKET_META[bracket];
  const now = new Date();
  const past =
    now.getHours() >= meta.end ||
    (bracket === 'morning' && now.getHours() >= 11 && now.getHours() < 6);

  return {
    id: `${bracket}-${pub.id}`,
    timeLabel: meta.timeLabel,
    timeEmoji: meta.timeEmoji,
    name: pub.name,
    type: 'pub',
    description: pub.tagline,
    actionLabel: 'Reserve spot',
    actionUrl: `order:${pub.id}`,
    swappable: past || now.getHours() >= meta.start,
  };
}

function slotFromActivity(activity: FreeActivity, bracket: Bracket): PlanSlot {
  const meta = BRACKET_META[bracket];
  const now = new Date();
  const past = now.getHours() >= meta.end;

  return {
    id: `${bracket}-${activity.id}`,
    timeLabel: meta.timeLabel,
    timeEmoji: meta.timeEmoji,
    name: activity.name,
    type: 'activity',
    description: activity.description,
    actionLabel: 'Open in Maps',
    actionUrl: `maps:${encodeURIComponent(activity.mapsQuery)}`,
    swappable: past || now.getHours() >= meta.start,
  };
}

interface TemplateSlot {
  bracket: Bracket;
  pubIndex?: number;
  activityIndex?: number;
}

const TEMPLATES: Record<CityKey, TemplateSlot[][]> = {
  la: [
    [
      { bracket: 'morning', activityIndex: 0 },
      { bracket: 'afternoon', activityIndex: 3 },
      { bracket: 'evening', pubIndex: 0 },
      { bracket: 'late', pubIndex: 1 },
    ],
    [
      { bracket: 'morning', activityIndex: 2 },
      { bracket: 'afternoon', activityIndex: 1 },
      { bracket: 'evening', pubIndex: 2 },
      { bracket: 'late', pubIndex: 0 },
    ],
    [
      { bracket: 'morning', activityIndex: 4 },
      { bracket: 'afternoon', pubIndex: 3 },
      { bracket: 'evening', activityIndex: 0 },
      { bracket: 'late', pubIndex: 1 },
    ],
  ],
  cdmx: [
    [
      { bracket: 'morning', activityIndex: 0 },
      { bracket: 'afternoon', activityIndex: 1 },
      { bracket: 'evening', pubIndex: 0 },
      { bracket: 'late', pubIndex: 1 },
    ],
    [
      { bracket: 'morning', activityIndex: 4 },
      { bracket: 'afternoon', activityIndex: 2 },
      { bracket: 'evening', pubIndex: 2 },
      { bracket: 'late', pubIndex: 3 },
    ],
    [
      { bracket: 'morning', activityIndex: 3 },
      { bracket: 'afternoon', pubIndex: 0 },
      { bracket: 'evening', activityIndex: 1 },
      { bracket: 'late', pubIndex: 2 },
    ],
  ],
  toronto: [
    [
      { bracket: 'morning', activityIndex: 4 },
      { bracket: 'afternoon', activityIndex: 1 },
      { bracket: 'evening', pubIndex: 0 },
      { bracket: 'late', pubIndex: 2 },
    ],
    [
      { bracket: 'morning', activityIndex: 0 },
      { bracket: 'afternoon', activityIndex: 3 },
      { bracket: 'evening', pubIndex: 1 },
      { bracket: 'late', pubIndex: 0 },
    ],
    [
      { bracket: 'morning', activityIndex: 2 },
      { bracket: 'afternoon', pubIndex: 2 },
      { bracket: 'evening', activityIndex: 1 },
      { bracket: 'late', pubIndex: 1 },
    ],
  ],
  ny: [
    [
      { bracket: 'morning', activityIndex: 0 },
      { bracket: 'afternoon', activityIndex: 4 },
      { bracket: 'evening', pubIndex: 0 },
      { bracket: 'late', pubIndex: 1 },
    ],
    [
      { bracket: 'morning', activityIndex: 2 },
      { bracket: 'afternoon', activityIndex: 1 },
      { bracket: 'evening', pubIndex: 2 },
      { bracket: 'late', pubIndex: 3 },
    ],
    [
      { bracket: 'morning', activityIndex: 3 },
      { bracket: 'afternoon', pubIndex: 0 },
      { bracket: 'evening', activityIndex: 0 },
      { bracket: 'late', pubIndex: 1 },
    ],
  ],
};

function buildPlan(cityKey: CityKey, ageTier: AgeTier): DayPlan {
  const city = CITIES.find((c) => c.id === cityKey)!;
  const templateIndex = new Date().getDay() % 3;
  const template = TEMPLATES[cityKey][templateIndex] ?? TEMPLATES[cityKey][0];

  const familyActivities = city.freeActivities.filter((a) => a.minAge === 0);
  const familyPubs = city.pubs.filter((p) => !isNightlifePub(p));
  const eveningActivities = familyActivities.filter((a) =>
    ['park', 'viewpoint', 'trail', 'landmark'].includes(a.category),
  );

  const slots: PlanSlot[] = template.map((t) => {
    if (t.bracket === 'late' && ageTier === 'family') {
      const activity = eveningActivities[t.activityIndex ?? 0] ?? familyActivities[0];
      return slotFromActivity(activity, 'evening');
    }

    if (t.pubIndex != null) {
      const pool = ageTier === 'family' ? familyPubs : city.pubs;
      const pub = pool[t.pubIndex % pool.length] ?? pool[0];
      return slotFromPub(pub, t.bracket);
    }

    const activity = familyActivities[t.activityIndex ?? 0] ?? city.freeActivities[0];
    return slotFromActivity(activity, t.bracket);
  });

  return {
    cityName: city.displayName,
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    slots,
  };
}

function alternateSlot(
  cityKey: CityKey,
  ageTier: AgeTier,
  bracket: Bracket,
  excludeIds: string[],
): PlanSlot | null {
  const city = CITIES.find((c) => c.id === cityKey);
  if (!city) return null;

  const pool: { slot: PlanSlot; id: string }[] = [];

  const pubs = ageTier === 'family' ? city.pubs.filter((p) => !isNightlifePub(p)) : city.pubs;
  for (const pub of pubs) {
    if (!excludeIds.includes(pub.id)) {
      pool.push({ slot: slotFromPub(pub, bracket), id: pub.id });
    }
  }

  const activities =
    ageTier === 'family'
      ? city.freeActivities.filter((a) => a.minAge === 0)
      : city.freeActivities;

  for (const activity of activities) {
    if (!excludeIds.includes(activity.id)) {
      pool.push({ slot: slotFromActivity(activity, bracket), id: activity.id });
    }
  }

  if (bracket === 'late' && ageTier === 'family') {
    const quiet = activities.filter((a) =>
      ['park', 'viewpoint', 'trail'].includes(a.category),
    );
    const pick = quiet.find((a) => !excludeIds.includes(a.id));
    if (pick) return slotFromActivity(pick, 'evening');
  }

  return pool[0]?.slot ?? null;
}

export function useDayPlanner(cityKey: CityKey, ageTier: AgeTier) {
  const [plan, setPlan] = useState<DayPlan>(() => buildPlan(cityKey, ageTier));
  const [swapCursor, setSwapCursor] = useState<Record<string, number>>({});

  const refreshPlan = useCallback(() => {
    setPlan(buildPlan(cityKey, ageTier));
    setSwapCursor({});
  }, [cityKey, ageTier]);

  useEffect(() => {
    setPlan(buildPlan(cityKey, ageTier));
    setSwapCursor({});
  }, [cityKey, ageTier]);

  const swapSlot = useCallback(
    (slotId: string) => {
      setPlan((prev) => {
        const idx = prev.slots.findIndex((s) => s.id === slotId);
        if (idx < 0) return prev;

        const slot = prev.slots[idx];
        const bracket = (['morning', 'afternoon', 'evening', 'late'] as Bracket[]).find(
          (b) => slot.timeLabel === BRACKET_META[b].timeLabel,
        ) ?? 'afternoon';

        const excludeIds = prev.slots.map((s) => s.id.split('-').slice(1).join('-'));
        const cursor = (swapCursor[slotId] ?? 0) + 1;
        setSwapCursor((c) => ({ ...c, [slotId]: cursor }));

        const next = alternateSlot(cityKey, ageTier, bracket, excludeIds);
        if (!next) return prev;

        const slots = [...prev.slots];
        slots[idx] = { ...next, swappable: true };
        return { ...prev, slots };
      });
    },
    [cityKey, ageTier, swapCursor],
  );

  return { plan, swapSlot, refreshPlan };
}
