// ============================================================
// CoinFlip.tsx
// Self-contained micro-feature inside FlashScreen.
// Renders as a small text button. On tap, expands inline to show
// a CSS-animated coin flip. Heads = confirm + CTA.
// Tails = swipe for another. Max 3 flips per Flash session.
// ============================================================

import { useState, useRef } from 'react';

interface Props {
  venueName: string;
  /** Called when the CTA inside the heads result is tapped */
  onPrimaryAction: () => void;
  /** Called when tails result's "swipe" button is tapped */
  onSwipeNext: () => void;
  /** Max flips per session (default 3) */
  maxFlips?: number;
}

type FlipState = 'idle' | 'flipping' | 'heads' | 'tails';

/** Deterministic "social proof" count seeded by venue name */
function socialCount(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return (hash % 200) + 200;
}

export function CoinFlip({ venueName, onPrimaryAction, onSwipeNext, maxFlips = 3 }: Props) {
  const [flipState, setFlipState]   = useState<FlipState>('idle');
  const [flipsUsed, setFlipsUsed]   = useState(0);
  const [expanded, setExpanded]     = useState(false);
  const [result, setResult]         = useState<'heads' | 'tails' | null>(null);
  const flipTimeoutRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exhausted = flipsUsed >= maxFlips;

  function doFlip() {
    if (exhausted || flipState === 'flipping') return;
    setExpanded(true);
    setFlipState('flipping');
    setResult(null);

    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    flipTimeoutRef.current = setTimeout(() => {
      const outcome: 'heads' | 'tails' = Math.random() > 0.5 ? 'heads' : 'tails';
      setResult(outcome);
      setFlipState(outcome);
      setFlipsUsed((n) => n + 1);
    }, 1200);
  }

  function flipAgain() {
    setFlipState('idle');
    setResult(null);
    doFlip();
  }

  const count = socialCount(venueName);

  // ── Exhausted state ──────────────────────────────────────────
  if (exhausted && flipState !== 'heads' && flipState !== 'tails') {
    return (
      <p className="text-center text-xs text-zinc-500 mt-1">
        Trust the app on this one.
      </p>
    );
  }

  // ── Idle trigger ─────────────────────────────────────────────
  if (!expanded) {
    return (
      <button
        onClick={doFlip}
        className="text-center text-xs text-zinc-600 w-full py-1 active:opacity-70 touch-manipulation transition-opacity"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        🪙 Flip for it
      </button>
    );
  }

  return (
    <div
      className="mt-2 overflow-hidden"
      style={{
        animation: 'coinPanelOpen 0.2s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes coinPanelOpen {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 400px; }
        }
        @keyframes coinFlipAnim {
          0%   { transform: rotateY(0deg);     }
          100% { transform: rotateY(1440deg);  }
        }
      `}</style>

      {/* Coin */}
      <div className="flex justify-center py-4">
        <div
          style={{
            width: 72, height: 72,
            borderRadius: '50%',
            animation: flipState === 'flipping'
              ? 'coinFlipAnim 1.2s ease-out forwards'
              : 'none',
            background: result === 'tails'
              ? 'linear-gradient(135deg, #a1a1aa 0%, #71717a 50%, #d4d4d8 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
            transition: 'background 0.3s ease',
          }}
        >
          {flipState === 'flipping' ? '🪙' : result === 'heads' ? '⚽' : '✕'}
        </div>
      </div>

      {/* Flipping label */}
      {flipState === 'flipping' && (
        <p className="text-center text-sm text-zinc-400 animate-pulse">Flipping…</p>
      )}

      {/* Heads result */}
      {flipState === 'heads' && (
        <div className="space-y-3">
          <p className="text-center text-base font-bold text-zinc-100">
            Heads — you're going.
          </p>
          <p className="text-center text-xs text-zinc-400 leading-snug px-2">
            Join the {count.toLocaleString()} people who flipped heads on this spot and rated it 4.7★
          </p>
          <button
            onClick={onPrimaryAction}
            className="w-full bg-emerald-500 text-zinc-950 font-bold py-3.5 rounded-xl active:scale-[0.97] transition-transform touch-manipulation text-sm"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Reserve My Spot →
          </button>
          {flipsUsed < maxFlips && (
            <button
              onClick={flipAgain}
              className="w-full text-center text-xs text-zinc-600 py-1 active:opacity-70 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Flip again
            </button>
          )}
        </div>
      )}

      {/* Tails result */}
      {flipState === 'tails' && (
        <div className="space-y-3">
          <p className="text-center text-base font-semibold text-zinc-300">
            Tails — swipe for another.
          </p>
          <p className="text-center text-xs text-zinc-500">
            Sometimes the second pick is the one.
          </p>
          <button
            onClick={onSwipeNext}
            className="w-full ring-1 ring-zinc-700 text-zinc-300 font-bold py-3 rounded-xl active:scale-[0.97] transition-transform touch-manipulation text-sm"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Swipe →
          </button>
          {flipsUsed < maxFlips && (
            <button
              onClick={flipAgain}
              className="w-full text-center text-xs text-zinc-600 py-1 active:opacity-70 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Flip again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
