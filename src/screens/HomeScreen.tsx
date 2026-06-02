import { useEffect, useState } from 'react';

import { EditorialCityHeader } from '../components/layout/EditorialCityHeader';
import { GlassPanel } from '../components/layout/GlassPanel';
import { FreeActivitiesSection } from '../components/FreeActivitiesSection';
import { PubsSection } from '../components/PubsSection';
import { CulinaryDirectory } from '../components/modules/CulinaryDirectory';
import { TransitHub } from '../components/modules/TransitHub';
import { LiveSportsCenter } from '../components/modules/LiveSportsCenter';
import { ParksTrailsDirectory } from '../components/modules/ParksTrailsDirectory';
import type { CityData, GeoState, Pub } from '../types';

// ─── MOOD FILTER ─────────────────────────────────────────────

interface MoodFilter {
  id: string;
  label: string;
}

const MOOD_FILTERS: MoodFilter[] = [
  { id: 'all',     label: '✨ Everything' },
  { id: 'eat',     label: '🍽 Eat'        },
  { id: 'drink',   label: '🍺 Drink'      },
  { id: 'explore', label: '🗺 Explore'    },
  { id: 'active',  label: '⚡ Active'     },
  { id: 'history', label: '🏛 History'    },
  { id: 'deals',   label: '🔥 Deals'      },
  { id: 'free',    label: '🆓 Free'       },
];

// ─── SECTION VISIBILITY ───────────────────────────────────────

function show(mood: string, section: string): boolean {
  if (mood === 'all') return true;
  const map: Record<string, string[]> = {
    eat:     ['culinary'],
    drink:   ['pubs'],
    explore: ['activities', 'parks'],
    active:  ['parks'],
    history: ['activities'],
    deals:   ['culinary'],
    free:    ['activities'],
  };
  return map[mood]?.includes(section) ?? false;
}

// ─── PROPS ───────────────────────────────────────────────────

interface HomeScreenProps {
  selectedCity: CityData;
  geo: GeoState;
  onTryNewCity: () => void;
  onRequestGeo: () => void;
  onOrderAhead: (pub: Pub) => void;
  onOpenPlanner: () => void;
}

// ─── HOME SCREEN ─────────────────────────────────────────────

export function HomeScreen({
  selectedCity,
  geo,
  onTryNewCity,
  onRequestGeo,
  onOrderAhead,
  onOpenPlanner,
}: HomeScreenProps) {
  const [mood, setMood] = useState('all');

  // Use geo.closestCityId when available (e.g. user in Little Rock);
  // otherwise fall back to the active World Cup city id.
  const cityKey = geo.closestCityId ?? selectedCity.id;

  useEffect(() => {
    if (geo.status === 'idle') {
      onRequestGeo();
    }
  }, [geo.status, onRequestGeo]);

  return (
    <div className="pb-28">
      <EditorialCityHeader
        displayName={selectedCity.displayName}
        geo={geo}
        onTryNewCity={onTryNewCity}
        onRequestGeo={onRequestGeo}
      />

      {/* ── Mood filter bar ────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3">
        {MOOD_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setMood(f.id)}
            className={[
              'px-4 py-2 rounded-full text-sm flex-shrink-0 transition-all duration-150 touch-manipulation',
              mood === f.id
                ? 'bg-emerald-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 ring-1 ring-zinc-800 text-zinc-400',
            ].join(' ')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Plan My Day ────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <button
          type="button"
          onClick={onOpenPlanner}
          className="w-full glass-panel rounded-2xl border-glass px-4 py-4 flex items-center justify-between active:scale-[0.98] touch-manipulation min-h-[56px] transition-transform duration-200"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="flex items-center gap-3 text-left">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-bold text-obsidian-text text-sm">Plan My Day</p>
              <p className="text-[12px] text-obsidian-muted mt-0.5">
                One tap — full itinerary, zero forms
              </p>
            </div>
          </div>
          <span className="text-obsidian-muted text-lg">›</span>
        </button>
      </div>

      {/* ── Flash section ──────────────────────────────────── */}
      <section className="px-5 mb-2">
        <p className="type-meta">Tonight&apos;s move</p>
        <h2 className="type-display text-xl mt-1">Flash picks one spot</h2>
        <p className="text-[13px] text-obsidian-muted mt-2 leading-relaxed max-w-sm">
          Tap the lightning bolt — we choose, you act. No endless scrolling.
        </p>
      </section>

      {/* ── Free activities ────────────────────────────────── */}
      {show(mood, 'activities') && (
        <FreeActivitiesSection activities={selectedCity.freeActivities} />
      )}

      {/* ── City Intelligence modules ──────────────────────── */}
      {(show(mood, 'culinary') || show(mood, 'parks') || mood === 'all') && (
        <div className="mt-8">
          <div className="px-5 mb-4">
            <p className="type-meta">City Intelligence</p>
            <h2 className="type-display text-lg mt-1">
              {geo.closestCityId === 'little-rock' ? 'Little Rock' : selectedCity.displayName}
            </h2>
          </div>

          {show(mood, 'culinary') && (
            <CulinaryDirectory cityKey={cityKey} />
          )}
          {mood === 'all' && (
            <>
              <TransitHub cityKey={cityKey} />
              <LiveSportsCenter cityKey={cityKey} />
            </>
          )}
          {show(mood, 'parks') && (
            <ParksTrailsDirectory cityKey={cityKey} />
          )}
        </div>
      )}

      {/* ── Watch-party pubs ───────────────────────────────── */}
      {show(mood, 'pubs') && (
        <div className="mt-2">
          <div className="px-5 mb-3">
            <p className="type-meta">Eat &amp; drink</p>
            <h2 className="type-display text-lg mt-1">Local favorites</h2>
          </div>
          <PubsSection pubs={selectedCity.pubs} onOrderAhead={onOrderAhead} />
        </div>
      )}

      {/* ── Footer note ────────────────────────────────────── */}
      {mood === 'all' && (
        <div className="px-4 mt-8 mb-4">
          <GlassPanel className="rounded-2xl p-4">
            <p className="text-[12px] text-obsidian-muted leading-relaxed">
              Matchday Shovel learns your city from GPS when allowed. Everything
              here is curated for actually going out — not algorithmic noise.
            </p>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
