import { useEffect, useState } from 'react';

import { useAgeTierContext } from '../context/AgeTierContext';
import type { AgeTier } from '../types';

const OPTIONS: { tier: AgeTier; emoji: string; label: string; description: string }[] = [
  {
    tier: 'family',
    emoji: '🧒',
    label: 'Family',
    description: 'Parks, trails, events & restaurants — all ages welcome',
  },
  {
    tier: 'adult',
    emoji: '🍺',
    label: 'Adults (18+)',
    description: 'Everything above plus bars, live music & nightlife',
  },
  {
    tier: 'open',
    emoji: '🥃',
    label: '21+ Only',
    description: 'Fully unlocked — bars, clubs, cocktail lounges & late night',
  },
];

export function AgeTierGate() {
  const { setAgeTier } = useAgeTierContext();
  const [flashId, setFlashId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleSelect = (tier: AgeTier) => {
    setFlashId(tier);
    window.setTimeout(() => setAgeTier(tier), 150);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-obsidian px-4 cinematic-grain"
      style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div className="mb-8 text-center relative z-10">
        <p className="type-meta text-emerald-400/90 mb-2">MatchDay Shovel</p>
        <p className="text-2xl font-black text-obsidian-text">⚽</p>
      </div>

      <h1 className="type-display text-2xl text-center mb-2 relative z-10">
        Who&apos;s exploring with you?
      </h1>
      <p className="text-sm text-obsidian-muted text-center mb-8 max-w-xs relative z-10">
        We&apos;ll personalize everything. You can change this anytime in Settings.
      </p>

      <div className="w-full max-w-md space-y-3 relative z-10">
        {OPTIONS.map((opt) => (
          <button
            key={opt.tier}
            type="button"
            onClick={() => handleSelect(opt.tier)}
            className={[
              'w-full text-left rounded-2xl glass-panel px-5 py-4 transition-all duration-150',
              'active:scale-[0.97] touch-manipulation min-h-[72px]',
              flashId === opt.tier
                ? 'ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/15'
                : '',
            ].join(' ')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{opt.emoji}</span>
              <div>
                <p className="font-bold text-obsidian-text text-base">{opt.label}</p>
                <p className="text-sm text-obsidian-muted mt-0.5">{opt.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
