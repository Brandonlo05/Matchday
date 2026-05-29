import { useCallback, useMemo, useRef } from 'react';

import { CITIES } from './useMatchdayEngine';
import type { AgeTier, CityKey, FlashItemType, FlashResult, FreeActivity, Pub } from '../types';

const NIGHTLIFE_WORDS = ['bar', 'cocktail', 'brewery', 'pint', 'nightlife'];

const CONTEXT_TEMPLATES = {
  morning: [
    'Perfect window before the afternoon match',
    'Start the day local — no tourist traps',
    'Walkable from downtown without a rideshare',
    'Exactly the kind of spot you do not find on Google',
  ],
  afternoon: [
    'Under 15 minutes from the stadium and still has walk-in space',
    'Local pick — tourists almost never end up here',
    'Ideal pit stop between fixtures today',
    'Still room for your group without a reservation',
  ],
  evening: [
    'The crowd builds here an hour before kickoff',
    'Screens are locked on the match — atmosphere is guaranteed',
    'Your best bet for a table without the stadium crush',
    'Fans here know the score before the announcer does',
  ],
  late: [
    'Late-night energy without the tourist markup',
    'Still serving when the final whistle echoes',
    'Where the city actually goes after the match',
    'Walk-in friendly even after 10 PM',
  ],
} as const;

interface FlashCandidate {
  id: string;
  name: string;
  type: FlashItemType;
  category: string;
  distanceLabel: string;
  vibeOrDescription: string;
  primaryActionLabel: string;
  primaryActionUrl: string;
  pubId?: string;
  weight: number;
}

function pubSearchText(pub: Pub): string {
  return `${pub.name} ${pub.tagline} ${pub.features.join(' ')}`.toLowerCase();
}

function isNightlifePub(pub: Pub): boolean {
  return NIGHTLIFE_WORDS.some((w) => pubSearchText(pub).includes(w));
}

function fmtPubDistance(pub: Pub): string {
  if (pub.distanceKm == null) return 'Near you';
  if (pub.distanceKm < 1) return `${Math.round(pub.distanceKm * 1000)} m away`;
  const miles = pub.distanceKm * 0.621371;
  return `${pub.distanceKm.toFixed(1)} km · ${miles.toFixed(1)} mi`;
}

function timeBucket(): keyof typeof CONTEXT_TEMPLATES {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  if (h < 22) return 'evening';
  return 'late';
}

function pickContext(category: string, bucket: keyof typeof CONTEXT_TEMPLATES): string {
  const pool = CONTEXT_TEMPLATES[bucket];
  const seed = category.length + bucket.length;
  return pool[seed % pool.length] ?? pool[0];
}

function activityCompatible(activity: FreeActivity, tier: AgeTier): boolean {
  if (tier === 'family') return activity.minAge === 0;
  if (tier === 'adult') return activity.minAge <= 18;
  return true;
}

function pubCompatible(pub: Pub, tier: AgeTier): boolean {
  if (tier === 'family' && isNightlifePub(pub)) return false;
  return true;
}

function buildCandidates(
  cityKey: CityKey,
  ageTier: AgeTier,
  leftIds: Set<string>,
): FlashCandidate[] {
  const city = CITIES.find((c) => c.id === cityKey);
  if (!city) return [];

  const bucket = timeBucket();
  const candidates: FlashCandidate[] = [];

  for (const pub of city.pubs) {
    if (leftIds.has(pub.id) || !pubCompatible(pub, ageTier)) continue;

    let weight = 0.55;
    if (bucket === 'morning') weight *= 0.7;
    if (bucket === 'evening' || bucket === 'late') weight *= 1.25;
    if (bucket === 'late' && ageTier !== 'family' && isNightlifePub(pub)) weight *= 1.8;
    if (bucket === 'morning' && !isNightlifePub(pub)) weight *= 1.2;

    candidates.push({
      id: pub.id,
      name: pub.name,
      type: 'pub',
      category: pub.neighborhood,
      distanceLabel: fmtPubDistance(pub),
      vibeOrDescription: pub.tagline,
      primaryActionLabel: 'Reserve my spot',
      primaryActionUrl: `order:${pub.id}`,
      pubId: pub.id,
      weight,
    });
  }

  for (const activity of city.freeActivities) {
    if (leftIds.has(activity.id) || !activityCompatible(activity, ageTier)) continue;

    let weight = 0.45;
    if (bucket === 'morning' || bucket === 'afternoon') weight *= 1.35;
    if (bucket === 'late') weight *= 0.5;

    candidates.push({
      id: activity.id,
      name: activity.name,
      type: 'activity',
      category: activity.category,
      distanceLabel: activity.distance,
      vibeOrDescription: activity.description,
      primaryActionLabel: 'Open in Maps',
      primaryActionUrl: `maps:${encodeURIComponent(activity.mapsQuery)}`,
      weight,
    });
  }

  return candidates;
}

function weightedPick(candidates: FlashCandidate[]): FlashCandidate | null {
  if (candidates.length === 0) return null;
  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let roll = Math.random() * total;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) return c;
  }
  return candidates[candidates.length - 1] ?? null;
}

export function useFlash(
  cityKey: CityKey,
  ageTier: AgeTier,
  getLeftSwipedIds: () => Set<string>,
) {
  const seenRef = useRef<Set<string>>(new Set());

  const getNext = useCallback((): FlashResult | null => {
    const leftIds = getLeftSwipedIds();
    const candidates = buildCandidates(cityKey, ageTier, leftIds).filter(
      (c) => !seenRef.current.has(c.id),
    );

    if (candidates.length === 0) {
      seenRef.current.clear();
      const refreshed = buildCandidates(cityKey, ageTier, leftIds);
      const pick = weightedPick(refreshed);
      if (!pick) return null;
      seenRef.current.add(pick.id);
      const bucket = timeBucket();
      return {
        id: pick.id,
        name: pick.name,
        type: pick.type,
        category: pick.category,
        distanceLabel: pick.distanceLabel,
        contextReason: pickContext(pick.category, bucket),
        primaryActionLabel: pick.primaryActionLabel,
        primaryActionUrl: pick.primaryActionUrl,
        vibeOrDescription: pick.vibeOrDescription,
        pubId: pick.pubId,
      };
    }

    const pick = weightedPick(candidates);
    if (!pick) return null;
    seenRef.current.add(pick.id);
    const bucket = timeBucket();

    return {
      id: pick.id,
      name: pick.name,
      type: pick.type,
      category: pick.category,
      distanceLabel: pick.distanceLabel,
      contextReason: pickContext(pick.category, bucket),
      primaryActionLabel: pick.primaryActionLabel,
      primaryActionUrl: pick.primaryActionUrl,
      vibeOrDescription: pick.vibeOrDescription,
      pubId: pick.pubId,
    };
  }, [cityKey, ageTier, getLeftSwipedIds]);

  const resetSession = useCallback(() => {
    seenRef.current.clear();
  }, []);

  const hasCandidates = useMemo(() => {
    const leftIds = getLeftSwipedIds();
    return buildCandidates(cityKey, ageTier, leftIds).length > 0;
  }, [cityKey, ageTier, getLeftSwipedIds]);

  return { getNext, resetSession, hasCandidates };
}
