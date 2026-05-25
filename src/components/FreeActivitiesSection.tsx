// ============================================================
// FreeActivitiesSection.tsx
// Zero-cost things to do in the active city.
// Reads ageTier from context — filters out minAge > 0 for family tier.
// ============================================================

import { useAgeTierContext } from '../context/AgeTierContext';
import type { FreeActivity, ActivityCategory } from '../types';

// ─── Category badge colors ────────────────────────────────────

const CATEGORY_META: Record<ActivityCategory, { label: string; color: string }> = {
  park:      { label: 'Park',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  trail:     { label: 'Trail',     color: 'text-teal-400 bg-teal-400/10 border-teal-400/20'         },
  landmark:  { label: 'Landmark',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'       },
  event:     { label: 'Event',     color: 'text-rose-400 bg-rose-400/10 border-rose-400/20'          },
  market:    { label: 'Market',    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20'    },
  viewpoint: { label: 'Viewpoint', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20'            },
};

// ─── Individual activity card ─────────────────────────────────

function ActivityCard({ activity }: { activity: FreeActivity }) {
  const meta = CATEGORY_META[activity.category];

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(activity.mapsQuery)}`;

  return (
    <div className="bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
      {/* Top row: category badge + distance */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            'inline-flex text-[10px] font-black px-2.5 py-1 rounded-full border tracking-widest uppercase',
            meta.color,
          ].join(' ')}
        >
          {meta.label}
        </span>
        <span className="text-[11px] text-zinc-500 font-medium">{activity.distance}</span>
      </div>

      {/* Name */}
      <div>
        <h3 className="text-base font-bold text-zinc-100 leading-tight">{activity.name}</h3>
        <p className="text-sm text-zinc-400 mt-1 leading-snug">{activity.description}</p>
      </div>

      {/* Tip — subtle divider + italic */}
      <div className="border-t border-zinc-800 pt-2.5">
        <p className="text-xs text-zinc-500 italic leading-snug">{activity.tip}</p>
      </div>

      {/* CTA */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 ring-1 ring-zinc-700 bg-zinc-800 rounded-xl px-4 py-2.5 active:scale-[0.97] active:bg-zinc-700 transition-all touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        📍 Open in Maps
      </a>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────

interface Props {
  activities: FreeActivity[];
}

export function FreeActivitiesSection({ activities }: Props) {
  const { ageTier } = useAgeTierContext();

  const visible = ageTier === 'family'
    ? activities.filter((a) => a.minAge === 0)
    : activities;

  if (visible.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 mb-3">
        <div className="w-1 h-5 rounded-full bg-emerald-500 flex-shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-zinc-100 leading-none">Free In This City</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">No tickets. No reservations.</p>
        </div>
      </div>

      {/* Cards */}
      <div className="px-4 space-y-3">
        {visible.map((act) => (
          <ActivityCard key={act.id} activity={act} />
        ))}
      </div>
    </div>
  );
}
