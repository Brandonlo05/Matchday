import { useMemo } from 'react';

import { useAgeTierContext } from '../context/AgeTierContext';
import type { FreeActivity, FreeActivityCategory } from '../types';

const CATEGORY_STYLES: Record<
  FreeActivityCategory,
  { label: string; badge: string }
> = {
  park: { label: 'Park', badge: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  trail: { label: 'Trail', badge: 'bg-teal-500/15 text-teal-400 ring-teal-500/30' },
  landmark: { label: 'Landmark', badge: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  event: { label: 'Event', badge: 'bg-rose-500/15 text-rose-400 ring-rose-500/30' },
  market: { label: 'Market', badge: 'bg-violet-500/15 text-violet-400 ring-violet-500/30' },
  viewpoint: { label: 'Viewpoint', badge: 'bg-sky-500/15 text-sky-400 ring-sky-500/30' },
};

interface Props {
  activities: FreeActivity[];
}

export function FreeActivitiesSection({ activities }: Props) {
  const { ageTier } = useAgeTierContext();

  const visible = useMemo(() => {
    if (ageTier === 'family') {
      return activities.filter((a) => a.minAge === 0);
    }
    return activities;
  }, [activities, ageTier]);

  if (visible.length === 0) return null;

  return (
    <section className="px-4 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-5 rounded-full bg-emerald-500" />
        <h2 className="type-display text-base">Free In This City</h2>
      </div>
      <p className="type-meta mb-4 pl-3">No tickets. No reservations.</p>

      <div className="space-y-3">
        {visible.map((activity) => {
          const style = CATEGORY_STYLES[activity.category];
          return (
            <article
              key={activity.id}
              className="rounded-2xl glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={[
                    'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ring-1',
                    style.badge,
                  ].join(' ')}
                >
                  {style.label}
                </span>
                <span className="text-[11px] text-zinc-500 shrink-0">{activity.distance}</span>
              </div>

              <h3 className="font-bold text-zinc-50 text-base mb-1">{activity.name}</h3>
              <p className="text-[13px] text-zinc-400 leading-snug mb-3">{activity.description}</p>

              <div className="border-t border-zinc-800 pt-2 mb-3">
                <p className="text-[12px] text-zinc-500 italic leading-snug">{activity.tip}</p>
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activity.mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 rounded-xl ring-1 ring-zinc-700 text-zinc-300 text-sm font-semibold active:opacity-80 touch-manipulation min-h-[44px]"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Open in Maps
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
