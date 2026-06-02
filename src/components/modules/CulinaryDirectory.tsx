// ============================================================
// MatchDay — Culinary Directory
// Profile-matched restaurant cards sorted by AI axis alignment
// ============================================================

import { useAIProfile } from '../../context/AIUserContext';
import type { AIUserProfile } from '../../context/AIUserContext';
import { getNearestAvailableCity } from '../../data/cityDataRouter';
import type { LRRestaurant, ProfileMatchTag } from '../../data/littleRockData';

// ─── MATCH SCORING ───────────────────────────────────────────

function computeMatchScore(
  restaurant: LRRestaurant,
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
  restaurant: LRRestaurant;
  score: number;
  isTopMatch: boolean;
  showHistoryBadge: boolean;
}

function RestaurantCard({
  restaurant,
  score,
  isTopMatch,
  showHistoryBadge,
}: RestaurantCardProps) {
  return (
    <article className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden">
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
        <h3 className="font-bold text-zinc-50 text-base">{restaurant.name}</h3>
        <p className="text-sm text-zinc-400 mt-1 leading-snug">
          {restaurant.description}
        </p>

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
            />
          ))}
        </div>
      )}
    </section>
  );
}
