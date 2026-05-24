// ============================================================
// NotificationRibbon.tsx
// Animated live-radar ribbon that pulses when a match is live,
// glows amber when kickoff < 2 hours, and scrolls headlines.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import type { Match, CountdownState } from '../types';

interface Props {
  match: Match | null;
  countdown: CountdownState | null;
  /** Optional extra headline strings (promos, announcements) */
  extraHeadlines?: string[];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function buildHeadlines(match: Match | null, countdown: CountdownState | null, extras: string[]): string[] {
  const lines: string[] = [];

  if (match && countdown) {
    if (countdown.isLive) {
      const periodStr =
        countdown.period === 'first_half'  ? `1st Half · ${countdown.matchMinute}'` :
        countdown.period === 'halftime'    ? 'Half Time' :
        countdown.period === 'second_half' ? `2nd Half · ${countdown.matchMinute}'` :
        countdown.period === 'extra_time'  ? `Extra Time · ${countdown.matchMinute}'` :
        countdown.period === 'penalties'   ? 'Penalties' :
        'In Progress';

      lines.push(
        `🔴 LIVE NOW — ${match.homeTeam.flag} ${match.homeTeam.code} vs ${match.awayTeam.flag} ${match.awayTeam.code}  ·  ${periodStr}`,
      );
    } else if (countdown.isPreKickoff) {
      lines.push(
        `⚡ KICKOFF IN ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)} — ${match.homeTeam.flag} ${match.homeTeam.code} vs ${match.awayTeam.flag} ${match.awayTeam.code} · Secure your table now`,
      );
    } else {
      const days = countdown.days > 0 ? `${countdown.days}d ` : '';
      lines.push(
        `⚽ Next match in ${days}${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)} — ${match.homeTeam.flag} ${match.homeTeam.code} vs ${match.awayTeam.flag} ${match.awayTeam.code} · ${match.phaseLabel}`,
      );
    }
  }

  lines.push(
    '🌎 World Cup 2026 — 3 host nations, 16 cities, 104 matches',
    '🎟️ Order ahead to lock in your watch party spot — zero walk-in guarantee',
    '📍 Tap "Use Location" to find the closest venue to you',
    ...extras,
  );

  return lines;
}

export function NotificationRibbon({ match, countdown, extraHeadlines = [] }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headlines = buildHeadlines(match, countdown, extraHeadlines);
  const isLive = countdown?.isLive ?? false;
  const isPreKickoff = (countdown?.isPreKickoff && !isLive) ?? false;

  // Rotate headlines every 4 seconds with a fade cycle
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((i) => (i + 1) % headlines.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [headlines.length]);

  // Reset to first headline (the live one) when match goes live
  useEffect(() => {
    if (isLive) setCurrentIdx(0);
  }, [isLive]);

  const bgClass = isLive
    ? 'bg-emerald-950 border-emerald-500/50'
    : isPreKickoff
    ? 'bg-amber-950 border-amber-500/50'
    : 'bg-zinc-900 border-zinc-800';

  const textClass = isLive
    ? 'text-emerald-300'
    : isPreKickoff
    ? 'text-amber-300'
    : 'text-zinc-400';

  return (
    <div
      className={[
        'relative flex items-center gap-2.5 px-4 py-2.5 border-b overflow-hidden',
        bgClass,
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Radar pulse dot */}
      <RadarDot isLive={isLive} isPreKickoff={isPreKickoff} />

      {/* Scrolling headline */}
      <p
        className={[
          'text-[11px] font-semibold leading-tight truncate flex-1 transition-opacity duration-300',
          textClass,
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {headlines[currentIdx]}
      </p>

      {/* Page dots */}
      <div className="flex-shrink-0 flex gap-0.5">
        {headlines.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIdx(i); setVisible(true); }}
            className={[
              'rounded-full transition-all duration-300',
              i === currentIdx
                ? `w-3 h-1.5 ${isLive ? 'bg-emerald-400' : isPreKickoff ? 'bg-amber-400' : 'bg-zinc-400'}`
                : 'w-1.5 h-1.5 bg-zinc-700',
            ].join(' ')}
            aria-label={`Headline ${i + 1}`}
          />
        ))}
      </div>

      {/* Glow bloom overlay when live */}
      {isLive && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 10% 50%, #10b981 0%, transparent 60%)',
            animation: 'ribbonGlow 2s ease-in-out infinite alternate',
          }}
        />
      )}

      <style>{`
        @keyframes ribbonGlow {
          from { opacity: 0.1; }
          to   { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ─── Radar pulse dot ─────────────────────────────────────────

function RadarDot({ isLive, isPreKickoff }: { isLive: boolean; isPreKickoff: boolean }) {
  const color = isLive ? 'bg-emerald-400' : isPreKickoff ? 'bg-amber-400' : 'bg-zinc-600';
  const pingColor = isLive ? 'bg-emerald-400' : isPreKickoff ? 'bg-amber-400' : 'bg-zinc-500';

  return (
    <span className="relative flex-shrink-0 flex h-2.5 w-2.5">
      {(isLive || isPreKickoff) && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}
        />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}
