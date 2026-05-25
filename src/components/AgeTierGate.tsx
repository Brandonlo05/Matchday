// ============================================================
// AgeTierGate.tsx
// One-time full-screen overlay. Blocks the entire app until
// the user selects their tier. Renders only once per install.
// No skip. No close. One decision, permanent.
// ============================================================

import { useState } from 'react';
import { useAgeTierContext } from '../context/AgeTierContext';
import type { AgeTier } from '../types';

interface TierOption {
  tier: AgeTier;
  emoji: string;
  label: string;
  description: string;
}

const OPTIONS: TierOption[] = [
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
  const { hasSelected, setAgeTier } = useAgeTierContext();
  const [flashId, setFlashId] = useState<AgeTier | null>(null);

  if (hasSelected) return null;

  function handleSelect(tier: AgeTier) {
    setFlashId(tier);
    // Brief flash animation, then commit
    setTimeout(() => {
      setAgeTier(tier);
    }, 160);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950"
      style={{ animation: 'ageFadeIn 0.2s ease-out forwards' }}
    >
      <div
        className="w-full px-6 flex flex-col items-center"
        style={{ maxWidth: 420 }}
      >
        {/* Logo + wordmark */}
        <div className="mb-8 text-center">
          <span className="text-4xl">⚽</span>
          <p className="mt-2 text-xl font-black tracking-tight text-zinc-100">
            MatchDay<span className="text-emerald-500">Shovel</span>
          </p>
          <p className="text-[11px] text-zinc-600 font-semibold tracking-widest uppercase mt-0.5">
            FIFA World Cup 2026
          </p>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-black text-zinc-100 text-center leading-tight mb-2">
          Who's exploring with you?
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
          We'll personalize everything.{' '}
          <span className="text-zinc-500">You can change this anytime in Settings.</span>
        </p>

        {/* Tier cards */}
        <div className="w-full space-y-3">
          {OPTIONS.map((opt) => {
            const isFlashing = flashId === opt.tier;
            return (
              <button
                key={opt.tier}
                onClick={() => handleSelect(opt.tier)}
                className="w-full flex items-center gap-4 bg-zinc-900 rounded-2xl px-5 py-4 text-left transition-all duration-150 active:scale-[0.98] touch-manipulation"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  outline: isFlashing ? '2px solid rgb(16,185,129)' : '1px solid rgb(39,39,42)',
                  outlineOffset: isFlashing ? '2px' : '0px',
                  boxShadow: isFlashing ? '0 0 0 4px rgba(16,185,129,0.15)' : 'none',
                  transition: 'outline 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
                }}
              >
                <span className="text-3xl flex-shrink-0" aria-hidden="true">
                  {opt.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-zinc-100 leading-none mb-1">
                    {opt.label}
                  </p>
                  <p className="text-sm text-zinc-400 leading-snug">
                    {opt.description}
                  </p>
                </div>
                <span className="text-zinc-600 flex-shrink-0 text-lg">›</span>
              </button>
            );
          })}
        </div>

        {/* Fine print */}
        <p className="mt-8 text-[11px] text-zinc-700 text-center">
          Your preference is saved only on this device.
        </p>
      </div>

      <style>{`
        @keyframes ageFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
