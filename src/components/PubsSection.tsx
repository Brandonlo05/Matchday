// ============================================================
// PubsSection.tsx
// Filterable venue list with scrollable feature-tag filter bar,
// empty state, and sorted-by-distance ordering.
// ============================================================

import { useState, useMemo } from 'react';
import { PubCard, FEATURE_META } from './PubCard';
import type { Pub, PubFeature } from '../types';

interface Props {
  pubs: Pub[];
  onOrderAhead: (pub: Pub) => void;
}

// Derive which filter tags are available for the current city's pubs
function getAvailableFilters(pubs: Pub[]): PubFeature[] {
  const seen = new Set<PubFeature>();
  pubs.forEach((p) => p.features.forEach((f) => seen.add(f)));
  // Sort by feature meta label alphabetically
  return Array.from(seen).sort((a, b) =>
    (FEATURE_META[a]?.label ?? a).localeCompare(FEATURE_META[b]?.label ?? b)
  );
}

export function PubsSection({ pubs, onOrderAhead }: Props) {
  const [activeFilters, setActiveFilters] = useState<PubFeature[]>([]);

  const availableFilters = useMemo(() => getAvailableFilters(pubs), [pubs]);

  const filteredPubs = useMemo(() => {
    if (activeFilters.length === 0) return pubs;
    return pubs.filter((p) =>
      activeFilters.every((f) => p.features.includes(f))
    );
  }, [pubs, activeFilters]);

  function toggleFilter(f: PubFeature) {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function clearFilters() {
    setActiveFilters([]);
  }

  return (
    <div>
      {/* ── Filter bar ──────────────────────────────────────── */}
      <div
        className="flex gap-2 px-4 overflow-x-auto py-2 mb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {/* "All" chip */}
        <button
          onClick={clearFilters}
          className={[
            'flex-shrink-0 text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 touch-manipulation',
            activeFilters.length === 0
              ? 'bg-zinc-200 text-zinc-900 border-zinc-200'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700',
          ].join(' ')}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          All Venues
        </button>

        {availableFilters.map((f) => {
          const meta = FEATURE_META[f];
          const active = activeFilters.includes(f);
          return (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className={[
                'flex-shrink-0 flex items-center gap-1 text-[12px] font-bold px-3.5 py-1.5 rounded-full border transition-all active:scale-95 touch-manipulation',
                active
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300',
              ].join(' ')}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="leading-none">{meta?.emoji}</span>
              {meta?.filterTag ?? f}
            </button>
          );
        })}
      </div>

      {/* ── Active filter summary ─────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-xs text-zinc-500">
            {filteredPubs.length} venue{filteredPubs.length !== 1 ? 's' : ''} match
            {filteredPubs.length !== 1 ? '' : 'es'} your filters
          </p>
          <button
            onClick={clearFilters}
            className="text-xs text-emerald-500 font-semibold active:opacity-60 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Clear ✕
          </button>
        </div>
      )}

      {/* ── Venue count header ───────────────────────────────── */}
      {activeFilters.length === 0 && (
        <div className="px-4 mb-3">
          <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-widest">
            {pubs.length} Watch Party Venue{pubs.length !== 1 ? 's' : ''}
            {pubs[0]?.distanceKm != null ? ' · Sorted by distance' : ''}
          </p>
        </div>
      )}

      {/* ── Pub cards ────────────────────────────────────────── */}
      <div className="px-4 flex flex-col gap-4">
        {filteredPubs.map((pub) => (
          <PubCard
            key={pub.id}
            pub={pub}
            activeFilters={activeFilters}
            onOrderAhead={onOrderAhead}
          />
        ))}

        {/* Empty state */}
        {filteredPubs.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-zinc-400 font-semibold">No venues match all selected filters</p>
            <p className="text-zinc-600 text-sm">Try removing a filter or two</p>
            <button
              onClick={clearFilters}
              className="mt-2 bg-zinc-800 text-zinc-300 text-sm font-bold px-5 py-2.5 rounded-xl border border-zinc-700 active:scale-95 transition-transform touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Show All Venues
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
