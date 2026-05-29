// ============================================================
// StickyFooterCapture.tsx
// Persistent bottom CTA bar that:
// · Shows match context + live countdown in the footer copy
// · Morphs between "LIVE → Find a Spot" and "Reserve Ahead"
// · Fades up from the bottom with a gradient mask
// · Respects iOS safe area bottom inset
// · Pulses green when a match is actively live
// ============================================================

import type { Match, CountdownState } from '../types';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface Props {
  nextMatch: Match | null;
  countdown: CountdownState | null;
  onReserve: () => void;
}

export function StickyFooterCapture({ nextMatch, countdown, onReserve }: Props) {
  const isLive      = countdown?.isLive ?? false;
  const isPreKickoff = (countdown?.isPreKickoff && !isLive) ?? false;

  function buildEyebrow(): string {
    if (!nextMatch || !countdown) return '⚽ World Cup 2026 — Secure your watch party spot';

    if (isLive) {
      const period =
        countdown.period === 'first_half'  ? `1st Half · ${countdown.matchMinute}'` :
        countdown.period === 'halftime'    ? 'Half Time' :
        countdown.period === 'second_half' ? `2nd Half · ${countdown.matchMinute}'` :
        countdown.period === 'extra_time'  ? `Extra Time · ${countdown.matchMinute}'` :
        countdown.period === 'penalties'   ? 'Penalties' :
        'In Progress';

      return `🔴 LIVE — ${nextMatch.homeTeam.flag} ${nextMatch.homeTeam.code} vs ${nextMatch.awayTeam.flag} ${nextMatch.awayTeam.code} · ${period}`;
    }

    if (isPreKickoff) {
      return `⚡ KICKOFF IN ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)} — Don't miss it`;
    }

    const days = countdown.days > 0 ? `${countdown.days}d ` : '';
    return `${nextMatch.homeTeam.flag} ${nextMatch.homeTeam.code} vs ${nextMatch.awayTeam.flag} ${nextMatch.awayTeam.code} · ${days}${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;
  }

  function buildCTA(): string {
    if (isLive) return '🔴 Find a Live Watch Party Now';
    if (isPreKickoff) return '⚡ Lock in Your Spot — Kickoff Soon';
    return '🎟️ Reserve a Watch Party Spot';
  }

  const ctaBg = isLive
    ? 'linear-gradient(135deg, #059669, #10b981)'
    : 'linear-gradient(135deg, #10b981, #34d399)';

  const ctaShadow = isLive
    ? '0 8px 32px rgba(5,150,105,0.4)'
    : '0 8px 32px rgba(16,185,129,0.35)';

  return (
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{ maxWidth: 480, margin: '0 auto' }}
    >
      {/* Gradient mask — fades the scrollable content into the footer */}
      <div
        className="pointer-events-none h-12 w-full"
        style={{
          background: 'linear-gradient(to top, rgba(11,15,25,1) 0%, rgba(11,15,25,0) 100%)',
        }}
      />

      {/* Footer content */}
      <div
        className="bg-obsidian px-4 pb-4 glass-nav"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Eyebrow / context line */}
        {nextMatch && (
          <p
            className={[
              'text-center text-[11px] font-medium mb-2 transition-colors duration-500',
              isLive ? 'text-emerald-400' : isPreKickoff ? 'text-amber-400' : 'text-zinc-500',
            ].join(' ')}
          >
            {buildEyebrow()}
          </p>
        )}

        {/* CTA button */}
        <button
          onClick={onReserve}
          className="w-full font-black text-zinc-950 text-base py-4 rounded-2xl transition-all active:scale-[0.97] touch-manipulation relative overflow-hidden"
          style={{
            WebkitTapHighlightColor: 'transparent',
            background: ctaBg,
            boxShadow: ctaShadow,
          }}
        >
          {/* Live pulse bloom */}
          {isLive && (
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.15), transparent 70%)',
                animation: 'footerBloom 1.8s ease-in-out infinite alternate',
              }}
            />
          )}
          <span className="relative z-10">{buildCTA()}</span>
        </button>
      </div>

      <style>{`
        @keyframes footerBloom {
          from { opacity: 0.4; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
