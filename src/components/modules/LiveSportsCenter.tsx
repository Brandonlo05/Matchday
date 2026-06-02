// ============================================================
// MatchDay — Live Sports Center
// Team cards with pulsing live badge + simulated scoreboard
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { getNearestAvailableCity } from '../../data/cityDataRouter';
import type { LRSportsTeam } from '../../data/littleRockData';

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

// ─── NEAREST CITY BANNER ─────────────────────────────────────

function NearestCityBanner() {
  return (
    <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
      <p className="text-[11px] text-amber-400 font-medium">
        Showing nearest available city · More cities coming soon
      </p>
    </div>
  );
}

// ─── TICKET TEAM CARD ────────────────────────────────────────

interface TicketTeamCardProps {
  team: LRSportsTeam;
}

function TicketTeamCard({ team }: TicketTeamCardProps) {
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

      {team.ticketUrl !== null && (
        <a
          href={team.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full h-[52px] bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm touch-manipulation active:scale-[0.97] transition-transform"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Buy Tickets →
        </a>
      )}
    </article>
  );
}

// ─── SCOREBOARD TEAM CARD ────────────────────────────────────

interface LiveScore {
  homeScore: number;
  awayScore: number;
}

const SCORE_INTERVAL_MS = 45_000;

interface ScoreboardTeamCardProps {
  team: LRSportsTeam;
}

function ScoreboardTeamCard({ team }: ScoreboardTeamCardProps) {
  const [score, setScore] = useState<LiveScore>({ homeScore: 68, awayScore: 62 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setScore((prev) => {
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

  return (
    <article className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-zinc-50 text-base">{team.name}</h3>
          <p className="text-sm text-zinc-500 mt-0.5">{team.venue}</p>
        </div>
        <LiveBadge />
      </div>

      <div className="rounded-xl bg-zinc-800/60 ring-1 ring-zinc-700/50 px-4 py-4 mb-4">
        <p className="type-meta text-center mb-4">Live Score</p>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-xs text-zinc-500 mb-1">Home</p>
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

interface LiveSportsCenterProps {
  cityKey: string;
}

export function LiveSportsCenter({ cityKey }: LiveSportsCenterProps) {
  const { data, isExact } = getNearestAvailableCity(cityKey);

  const ticketTeam = data.sportsTeams[0];
  const scoreboardTeam = data.sportsTeams[1];

  return (
    <section className="pb-6">
      {!isExact && <NearestCityBanner />}

      <div className="px-4 mb-4">
        <p className="type-meta text-emerald-400/90">What&apos;s on</p>
        <h2 className="type-display text-xl mt-1">Live Sports</h2>
      </div>

      <div className="px-4 space-y-3">
        {ticketTeam !== undefined && (
          <TicketTeamCard team={ticketTeam} />
        )}
        {scoreboardTeam !== undefined && (
          <ScoreboardTeamCard team={scoreboardTeam} />
        )}
        {ticketTeam === undefined && scoreboardTeam === undefined && (
          <p className="text-sm text-zinc-500 text-center py-10">
            No sports teams available for this city.
          </p>
        )}
      </div>
    </section>
  );
}
