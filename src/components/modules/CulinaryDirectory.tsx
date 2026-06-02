// ============================================================
// MatchDay — Culinary Directory
// Profile-matched restaurant cards, live deal countdowns, seeded activity
// ============================================================

import { useAIProfile } from '../../context/AIUserContext';
import type { AIUserProfile } from '../../context/AIUserContext';
import { getNearestAvailableCity } from '../../data/cityDataRouter';
import type { CityIntelligenceData } from '../../data/cityDataRouter';
import type { ProfileMatchTag } from '../../data/littleRockData';

// ─── LOCAL TYPES ─────────────────────────────────────────────

type RestaurantData = CityIntelligenceData['restaurants'][number];

// ─── MATCH SCORING ───────────────────────────────────────────

function computeMatchScore(
  restaurant: RestaurantData,
  profile: AIUserProfile,
): number {
  const activeValues: ProfileMatchTag[] = [
    profile.pace,
    profile.cognitiveStyle,
    profile.fuelSource,
    profile.socialDynamic,
    profile.culturalTribe,
  ];
  return restaurant.profileMatchTags.filter((tag) =>
    activeValues.includes(tag),
  ).length;
}

// ─── DEAL COUNTDOWN HELPERS ──────────────────────────────────

function parseDealEndMinutes(windowStr: string): number | null {
  // Extracts end time from strings like "4:00pm - 7:00pm Mon-Fri"
  const m = /\d+:\d+[ap]m\s*[-–]\s*(\d+):(\d+)(am|pm)/i.exec(windowStr);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const p = m[3].toLowerCase();
  if (p === 'pm' && h !== 12) h += 12;
  if (p === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

function formatCountdown(label: string, minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0
      ? `${label} · ends in ${h}h ${m}m`
      : `${label} · ends in ${h}h`;
  }
  return `${label} · ends in ${minutes} min`;
}

function getDealBadge(
  deals: RestaurantData['deals'],
  now: Date,
): string | null {
  if (!deals) return null;
  const totalMin = now.getHours() * 60 + now.getMinutes();

  // Lunch window: 10:30 AM – 3:00 PM
  if (deals.hasLunchSpecial && deals.lunchHours !== null) {
    const windowEnd = parseDealEndMinutes(deals.lunchHours) ?? 15 * 60;
    if (totalMin >= 10 * 60 + 30 && totalMin < windowEnd) {
      const remaining = windowEnd - totalMin;
      if (remaining > 0) return formatCountdown('LUNCH DEAL', remaining);
    }
  }

  // Happy hour window: 3:30 PM – 7:00 PM
  if (deals.hasHappyHour && deals.happyHourWindow !== null) {
    const windowEnd = parseDealEndMinutes(deals.happyHourWindow) ?? 19 * 60;
    if (totalMin >= 15 * 60 + 30 && totalMin < windowEnd) {
      const remaining = windowEnd - totalMin;
      if (remaining > 0) return formatCountdown('HAPPY HOUR', remaining);
    }
  }

  return null;
}

// ─── LIVE COUNT HELPERS ───────────────────────────────────────

function getLiveCount(venueId: string, hour: number): number {
  const seed = venueId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = (seed % 40) + 15;
  const multipliers = [
    0.3, 0.2, 0.2, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0,
    1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.1, 1.2, 1.4,
    1.5, 1.4, 1.2, 1.0, 0.8, 0.5,
  ];
  const hourMultiplier = multipliers[hour] ?? 1;
  return Math.round(base * hourMultiplier);
}

function isRestaurantOpen(
  hours: RestaurantData['hours'],
  now: Date,
): boolean {
  if (!hours) return false;
  const days = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
  ];
  const dayKey = days[now.getDay()];
  if (!dayKey) return false;
  const hoursStr = hours[dayKey];
  if (!hoursStr || hoursStr.toLowerCase() === 'closed') return false;

  const m = /(\d+):(\d+)(am|pm)\s*[-–]\s*(\d+):(\d+)(am|pm)/i.exec(hoursStr);
  if (!m) return false;

  const toMin = (h: string, min: string, p: string): number => {
    let hh = parseInt(h, 10);
    const mm = parseInt(min, 10);
    if (p.toLowerCase() === 'pm' && hh !== 12) hh += 12;
    if (p.toLowerCase() === 'am' && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  const openMin  = toMin(m[1] ?? '0', m[2] ?? '0', m[3] ?? 'am');
  const closeMin = toMin(m[4] ?? '0', m[5] ?? '0', m[6] ?? 'am');
  const curMin   = now.getHours() * 60 + now.getMinutes();
  return curMin >= openMin && curMin < closeMin;
}

// ─── NEAREST CITY BANNER ─────────────────────────────────────

function NearestCityBanner() {
  return (
    <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
      <p className="text-[11px] text-amber-400 font-medium">
        Showing nearest available city · More cities coming soon
      </p>
    </div>
  );
}

// ─── RESTAURANT CARD ─────────────────────────────────────────

interface RestaurantCardProps {
  restaurant: RestaurantData;
  score: number;
  isTopMatch: boolean;
  showHistoryBadge: boolean;
  now: Date;
}

function RestaurantCard({
  restaurant,
  score,
  isTopMatch,
  showHistoryBadge,
  now,
}: RestaurantCardProps) {
  const dealBadge = getDealBadge(restaurant.deals, now);
  const isOpen    = isRestaurantOpen(restaurant.hours, now);
  const liveCount = isOpen ? getLiveCount(restaurant.id, now.getHours()) : 0;

  return (
    <article className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden">
      {/* Top Match badge */}
      {isTopMatch && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Top Match
          </span>
          <span className="text-[10px] text-emerald-500/60">
            {score}/{5} axes aligned
          </span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-bold text-zinc-50 text-base">{restaurant.name}</h3>
          {/* Live deal countdown badge */}
          {dealBadge && (
            <span className="flex-shrink-0 bg-amber-500/20 ring-1 ring-amber-500/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {dealBadge}
            </span>
          )}
        </div>

        {/* Seeded live activity count */}
        {isOpen && liveCount > 0 && (
          <p className="text-[11px] text-zinc-500 mb-1">
            🔴 {liveCount} here now
          </p>
        )}

        <p className="text-sm text-zinc-400 mt-1 leading-snug">
          {restaurant.description}
        </p>

        {/* Historical heritage badge */}
        {showHistoryBadge && (
          <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
              Heritage
            </p>
            <p className="text-sm text-amber-300/80 leading-relaxed">
              {restaurant.historicalBadge.copy ?? ''}
            </p>
          </div>
        )}

        {/* Primary action */}
        <a
          href={restaurant.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center w-full h-[52px] bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm touch-manipulation active:scale-[0.97] transition-transform"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Visit Website →
        </a>
      </div>
    </article>
  );
}

// ─── CULINARY DIRECTORY ───────────────────────────────────────

interface CulinaryDirectoryProps {
  cityKey: string;
}

export function CulinaryDirectory({ cityKey }: CulinaryDirectoryProps) {
  const { profile } = useAIProfile();
  const { data, isExact } = getNearestAvailableCity(cityKey);
  const now = new Date();

  const scored = data.restaurants
    .map((restaurant) => ({
      restaurant,
      score: computeMatchScore(restaurant, profile),
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;

  return (
    <section className="pb-6">
      {!isExact && <NearestCityBanner />}

      <div className="px-4 mb-4">
        <p className="type-meta text-emerald-400/90">Curated for your profile</p>
        <h2 className="type-display text-xl mt-1">Local Dining</h2>
      </div>

      {scored.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10 px-4">
          No restaurants available.
        </p>
      ) : (
        <div className="px-4 space-y-3">
          {scored.map(({ restaurant, score }, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              score={score}
              isTopMatch={index === 0 && topScore > 0}
              showHistoryBadge={
                profile.historyInterest && restaurant.historicalBadge.active
              }
              now={now}
            />
          ))}
        </div>
      )}
    </section>
  );
}
