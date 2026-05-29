import { useCallback, useState } from 'react';

function seededCount(venueId: string): number {
  const sum = venueId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return (sum % 200) + 200;
}

interface CoinFlipProps {
  venueName: string;
  venueId: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onSwipeNext: () => void;
  flipCount: number;
  maxFlips: number;
  onFlipComplete: () => void;
}

export function CoinFlip({
  venueId,
  primaryActionLabel,
  onPrimaryAction,
  onSwipeNext,
  flipCount,
  maxFlips,
  onFlipComplete,
}: CoinFlipProps) {
  const [expanded, setExpanded] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);

  const disabled = flipCount >= maxFlips;

  const runFlip = useCallback(() => {
    if (disabled) return;
    setExpanded(true);
    setFlipping(true);
    setResult(null);
    onFlipComplete();

    const outcome: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    window.setTimeout(() => {
      setFlipping(false);
      setResult(outcome);
    }, 1200);
  }, [disabled, onFlipComplete]);

  if (disabled) {
    return (
      <p className="text-center text-xs text-obsidian-muted py-2">Trust the app on this one.</p>
    );
  }

  return (
    <div className="w-full">
      {!expanded ? (
        <button
          type="button"
          onClick={runFlip}
          className="w-full text-center text-xs text-obsidian-muted py-2 active:opacity-80 touch-manipulation min-h-[44px]"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          🪙 Flip for it
        </button>
      ) : (
        <div
          className="overflow-hidden transition-all duration-200 ease-out"
          style={{ maxHeight: expanded ? 340 : 0 }}
        >
          <div className="flex flex-col items-center py-4">
            <div className="coin-scene mb-4" style={{ perspective: '720px' }}>
              <div
                className={[
                  'coin-face w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black',
                  flipping ? 'coin-face--spinning' : '',
                  result === 'tails' ? 'coin-face--tails' : 'coin-face--heads',
                ].join(' ')}
              >
                {flipping ? '' : result === 'heads' ? 'H' : result === 'tails' ? 'T' : '🪙'}
              </div>
            </div>

            {result === 'heads' && (
              <div className="w-full text-center animate-[fadeUp_0.3s_ease-out]">
                <p className="font-bold text-obsidian-text text-base">Heads — you&apos;re going.</p>
                <p className="text-[12px] text-obsidian-muted mt-2 leading-snug px-2">
                  Join the {seededCount(venueId)} people who flipped heads on this spot and rated
                  it 4.7★.
                </p>
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="mt-4 w-full bg-emerald-500 text-obsidian font-bold py-3 rounded-xl active:scale-[0.97] touch-manipulation min-h-[44px] flash-fab-glow"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {primaryActionLabel}
                </button>
              </div>
            )}

            {result === 'tails' && (
              <div className="w-full text-center">
                <p className="font-bold text-obsidian-soft text-base">Tails — swipe for another.</p>
                <p className="text-[12px] text-obsidian-muted mt-2">
                  Sometimes the second pick is the one.
                </p>
                <button
                  type="button"
                  onClick={onSwipeNext}
                  className="mt-4 w-full border-glass glass-panel text-obsidian-soft font-semibold py-3 rounded-xl active:opacity-80 touch-manipulation min-h-[44px]"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Swipe →
                </button>
              </div>
            )}

            {result && (
              <button
                type="button"
                onClick={runFlip}
                className="mt-3 text-xs text-obsidian-muted active:opacity-80 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Flip again
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .coin-scene {
          width: 5rem;
          height: 5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .coin-face {
          transform-style: preserve-3d;
          backface-visibility: hidden;
          background: linear-gradient(145deg, #fcd34d 0%, #b45309 55%, #92400e 100%);
          color: #0b0f19;
          box-shadow:
            0 6px 18px rgba(0, 0, 0, 0.45),
            inset 0 2px 4px rgba(255, 255, 255, 0.35),
            inset 0 -3px 6px rgba(0, 0, 0, 0.25);
        }
        .coin-face--tails {
          background: linear-gradient(145deg, #e4e4e7 0%, #71717a 50%, #52525b 100%);
        }
        .coin-face--spinning {
          animation: coinSpin3d 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
