// ============================================================
// MatchCard.tsx
// Rich match card with CSS flag gradients, phase badge,
// CountdownTimer integration, and channel/stadium metadata.
// ============================================================

import { CountdownTimer } from './CountdownTimer';
import type { Match, CountdownState } from '../types';

interface Props {
  match: Match;
  countdown?: CountdownState | null;
  /** If true, renders a compact strip instead of a full card */
  compact?: boolean;
  onWatchParty?: (match: Match) => void;
}

// Map of FIFA team codes to CSS gradient pairs (home kit inspired)
const TEAM_GRADIENTS: Record<string, [string, string]> = {
  USA: ['#002868', '#BF0A30'],
  MEX: ['#006847', '#CE1126'],
  CAN: ['#FF0000', '#FFFFFF'],
  ARG: ['#74ACDF', '#FFFFFF'],
  BRA: ['#009C3B', '#FFDF00'],
  ENG: ['#FFFFFF', '#CF081F'],
  FRA: ['#002395', '#ED2939'],
  ESP: ['#AA151B', '#F1BF00'],
  GER: ['#000000', '#DD0000'],
  POR: ['#006600', '#FF0000'],
  MAR: ['#C1272D', '#006233'],
  JPN: ['#FFFFFF', '#BC002D'],
  NED: ['#FF6600', '#FFFFFF'],
  URU: ['#75AADB', '#FFFFFF'],
  COL: ['#FCD116', '#003087'],
  SEN: ['#00853F', '#FDEF42'],
  AUS: ['#00008B', '#FFCD00'],
  KOR: ['#C60C30', '#003478'],
};

function TeamFlag({ code, flag, side }: { code: string; flag: string; side: 'home' | 'away' }) {
  const [c1, c2] = TEAM_GRADIENTS[code] ?? ['#27272a', '#3f3f46'];
  const gradDir = side === 'home' ? 'to right' : 'to left';

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* CSS flag-inspired gradient circle */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(${gradDir}, ${c1}33, ${c2}22)`,
          border: `1.5px solid ${c1}40`,
        }}
      >
        <span style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{flag}</span>
        {/* Kit stripe accent */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(${gradDir}, ${c1} 0%, transparent 40%)`,
          }}
        />
      </div>
      <span className="text-xs font-black text-zinc-200 tracking-widest">{code}</span>
    </div>
  );
}

function PhaseBadge({ label, isLive, isPreKickoff, isFinal }: {
  label: string; isLive: boolean; isPreKickoff: boolean; isFinal: boolean;
}) {
  const base = 'text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full';
  if (isLive) return (
    <span className={`${base} bg-emerald-500/20 text-emerald-400 border border-emerald-500/40`}>
      🔴 LIVE
    </span>
  );
  if (isPreKickoff) return (
    <span className={`${base} bg-amber-500/20 text-amber-400 border border-amber-500/40`}>
      ⚡ SOON
    </span>
  );
  if (isFinal) return (
    <span className={`${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/40`}>
      🏆 THE FINAL
    </span>
  );
  return (
    <span className={`${base} bg-zinc-800 text-zinc-500 border border-zinc-700`}>
      {label}
    </span>
  );
}

export function MatchCard({ match, countdown, compact = false, onWatchParty }: Props) {
  const isLive = countdown?.isLive ?? false;
  const isPreKickoff = (countdown?.isPreKickoff && !isLive) ?? false;
  const isFinal = match.phase === 'final';

  const cardBorder = isLive
    ? 'border-emerald-500/30 shadow-emerald-500/10 shadow-lg'
    : isPreKickoff
    ? 'border-amber-500/30 shadow-amber-500/10 shadow-lg'
    : isFinal
    ? 'border-yellow-500/30 shadow-yellow-500/10 shadow-lg'
    : 'border-zinc-800';

  if (compact) {
    return (
      <div className={`flex items-center gap-3 bg-zinc-900/80 rounded-xl px-4 py-3 border ${cardBorder} transition-all duration-300`}>
        <span className="text-xl">{match.homeTeam.flag}</span>
        <span className="text-xs font-bold text-zinc-400">{match.homeTeam.code}</span>
        <div className="flex-1 text-center">
          <PhaseBadge label={match.phaseLabel} isLive={isLive} isPreKickoff={isPreKickoff} isFinal={isFinal} />
        </div>
        <span className="text-xs font-bold text-zinc-400">{match.awayTeam.code}</span>
        <span className="text-xl">{match.awayTeam.flag}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        'rounded-2xl overflow-hidden border bg-zinc-900 transition-all duration-500',
        cardBorder,
        isLive ? 'bg-zinc-900' : '',
      ].join(' ')}
    >
      {/* Top glow bar */}
      <div
        className="h-0.5 w-full"
        style={{
          background: isLive
            ? 'linear-gradient(to right, transparent, #10b981, transparent)'
            : isPreKickoff
            ? 'linear-gradient(to right, transparent, #f59e0b, transparent)'
            : isFinal
            ? 'linear-gradient(to right, transparent, #eab308, transparent)'
            : 'transparent',
          opacity: isLive || isPreKickoff || isFinal ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Phase + TV row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <PhaseBadge label={match.phaseLabel} isLive={isLive} isPreKickoff={isPreKickoff} isFinal={isFinal} />
        {match.tvChannel && (
          <span className="text-[10px] text-zinc-500 font-medium">📺 {match.tvChannel}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between px-6 py-4">
        <TeamFlag code={match.homeTeam.code} flag={match.homeTeam.flag} side="home" />
        <div className="flex flex-col items-center gap-2">
          {countdown ? (
            <CountdownTimer countdown={countdown} size="sm" showDays />
          ) : (
            <span className="text-zinc-600 font-bold text-sm">VS</span>
          )}
        </div>
        <TeamFlag code={match.awayTeam.code} flag={match.awayTeam.flag} side="away" />
      </div>

      {/* Stadium + date */}
      <div className="px-4 pb-3 flex flex-col items-center gap-0.5">
        <p className="text-[11px] text-zinc-500 text-center">
          {match.stadium.name}
        </p>
        <p className="text-[11px] text-zinc-600 text-center">
          {new Date(match.kickoffISO).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          })} · {new Date(match.kickoffISO).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
          })}
        </p>
      </div>

      {/* Watch party CTA */}
      {onWatchParty && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onWatchParty(match)}
            className={[
              'w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] touch-manipulation',
              isLive
                ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25 active:bg-emerald-400'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700',
            ].join(' ')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isLive ? '🔴 Find a Live Watch Party Now' : '🎟️ Reserve a Watch Party Spot'}
          </button>
        </div>
      )}
    </div>
  );
}
