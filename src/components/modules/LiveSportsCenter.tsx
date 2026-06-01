// ============================================================
// MatchDay — Live Sports Center (Little Rock)
// Arkansas Travelers + Little Rock Trojans with live score sim
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { littleRockData } from '../../data/littleRockData';

// ─── LIVE BADGE ──────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
        Live
      </span>
    </div>
  );
}

// ─── TRAVELERS CARD ──────────────────────────────────────────

function TravelersCard() {
  const team = littleRockData.sportsTeams.find((t) => t.id === 'lr-sports-001');
  if (!team) return null;

  return (
    <article className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-zinc-50 text-base">{team.name}</h3>
          <p className="text-sm text-zinc-500 mt-0.5">{team.venue}</p>
        </div>
        <LiveBadge />
      </div>

      <p className="text-sm text-zinc-400 leading-snug mb-4">{team.description}</p>

      <a
        href="https://www.milb.com/arkansas/tickets"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-full h-[52px] bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm touch-manipulation active:scale-[0.97] transition-transform"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        Buy Tickets →
      </a>
    </article>
  );
}

// ─── TROJANS CARD (simulated live scoreboard) ─────────────────

interface LiveScore {
  homeScore: number;
  awayScore: number;
}

const SCORE_INTERVAL_MS = 45_000;

function TrojansCard() {
  const team = littleRockData.sportsTeams.find((t) => t.id === 'lr-sports-002');
  const [score, setScore] = useState<LiveScore>({ homeScore: 68, awayScore: 62 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setScore((prev) => {
        // Randomly add 1–3 pts to one team per interval
        const pts = Math.floor(Math.random() * 3) + 1;
        return Math.random() < 0.55
          ? { ...prev, homeScore: prev.homeScore + pts }
          : { ...prev, awayScore: prev.awayScore + pts };
      });
    }, SCORE_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  if (!team) return null;

  return (
    <article className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-zinc-50 text-base">{team.name}</h3>
          <p className="text-sm text-zinc-500 mt-0.5">{team.venue}</p>
        </div>
        <LiveBadge />
      </div>

      {/* Live scoreboard */}
      <div className="rounded-xl bg-zinc-800/60 ring-1 ring-zinc-700/50 px-4 py-4 mb-4">
        <p className="type-meta text-center mb-4">Live Score</p>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-xs text-zinc-500 mb-1">Little Rock</p>
            <p className="text-4xl font-black text-zinc-50 tabular-nums">
              {score.homeScore}
            </p>
          </div>
          <div className="px-4 text-zinc-600 text-sm font-bold">vs</div>
          <div className="flex-1 text-center">
            <p className="text-xs text-zinc-500 mb-1">Visitor</p>
            <p className="text-4xl font-black text-zinc-400 tabular-nums">
              {score.awayScore}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-400 leading-snug">{team.description}</p>
    </article>
  );
}

// ─── LIVE SPORTS CENTER ───────────────────────────────────────

export function LiveSportsCenter() {
  return (
    <section className="px-4 pb-6">
      <div className="mb-4">
        <p className="type-meta text-emerald-400/90">What&apos;s on</p>
        <h2 className="type-display text-xl mt-1">Live Sports</h2>
      </div>

      <div className="space-y-3">
        <TravelersCard />
        <TrojansCard />
      </div>
    </section>
  );
}
