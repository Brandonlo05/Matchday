// ============================================================
// MatchDay — Parks & Trails Directory (Little Rock)
// Two pill tabs with exact trail captions and Maps deep links
// ============================================================

import { useState } from 'react';
import { littleRockData } from '../../data/littleRockData';
import type { LRTrail } from '../../data/littleRockData';

// ─── TYPES ───────────────────────────────────────────────────

type TrailTab = LRTrail['tab'];

const TABS: TrailTab[] = ['Top Trails', 'Best Trails for Views'];

// ─── TRAIL CARD ──────────────────────────────────────────────

interface TrailCardProps {
  trail: LRTrail;
}

function TrailCard({ trail }: TrailCardProps) {
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    trail.mapsQuery,
  )}`;

  return (
    <article className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <h3 className="font-bold text-zinc-50 text-base mb-2">{trail.name}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed mb-4 italic">
        {trail.caption}
      </p>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-full h-[52px] bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm touch-manipulation active:scale-[0.97] transition-transform"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        Get Directions →
      </a>
    </article>
  );
}

// ─── PARKS & TRAILS DIRECTORY ─────────────────────────────────

export function ParksTrailsDirectory() {
  const [activeTab, setActiveTab] = useState<TrailTab>('Top Trails');

  const filteredTrails = littleRockData.trails.filter(
    (t) => t.tab === activeTab,
  );

  return (
    <section className="px-4 pb-6">
      <div className="mb-4">
        <p className="type-meta text-emerald-400/90">Outside</p>
        <h2 className="type-display text-xl mt-1">Parks &amp; Trails</h2>
      </div>

      {/* ── Pill tabs ──────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 h-[44px] rounded-full text-xs font-bold transition-all duration-150 touch-manipulation px-2',
              activeTab === tab
                ? 'bg-emerald-500 text-zinc-950'
                : 'glass-panel text-zinc-400',
            ].join(' ')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Trail cards ───────────────────────────────────── */}
      <div className="space-y-3">
        {filteredTrails.length > 0 ? (
          filteredTrails.map((trail) => (
            <TrailCard key={trail.id} trail={trail} />
          ))
        ) : (
          <p className="text-sm text-zinc-500 text-center py-10">
            No trails in this category.
          </p>
        )}
      </div>
    </section>
  );
}
