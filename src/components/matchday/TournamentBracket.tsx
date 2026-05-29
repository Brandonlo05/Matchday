import type { Match } from '../../types';
import { GlassPanel } from '../layout/GlassPanel';

interface TournamentBracketProps {
  matches: Match[];
  cityLabel: string;
}

const PHASE_ORDER = ['final', 'semifinal', 'quarterfinal', 'round_of_16', 'round_of_32'] as const;

function phaseTitle(phase: string): string {
  switch (phase) {
    case 'final':
      return 'Final';
    case 'semifinal':
      return 'Semifinals';
    case 'quarterfinal':
      return 'Quarterfinals';
    case 'round_of_16':
      return 'Round of 16';
    case 'round_of_32':
      return 'Round of 32';
    default:
      return 'Knockout';
  }
}

export function TournamentBracket({ matches, cityLabel }: TournamentBracketProps) {
  const knockout = matches.filter((m) => m.phase !== 'group');
  const grouped = PHASE_ORDER.map((phase) => ({
    phase,
    title: phaseTitle(phase),
    items: knockout.filter((m) => m.phase === phase),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) {
    return (
      <GlassPanel className="mx-4 p-5 rounded-2xl">
        <p className="type-meta mb-2">Knockout path</p>
        <p className="text-sm text-obsidian-muted">
          Bracket slots for {cityLabel} fill in as the tournament advances.
        </p>
      </GlassPanel>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="type-meta">Tournament pulse</p>
          <h2 className="type-display text-lg mt-1">Knockout bracket</h2>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90 px-2 py-1 rounded-full border border-amber-500/25 bg-amber-500/10">
          {cityLabel}
        </span>
      </div>

      <div className="space-y-4">
        {grouped.map((group) => (
          <GlassPanel key={group.phase} className="rounded-2xl p-4 overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-obsidian-muted mb-3">
              {group.title}
            </p>
            <div className="space-y-2">
              {group.items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-glass"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{m.homeTeam.flag}</span>
                    <span className="text-[11px] font-bold text-obsidian-soft truncate">
                      {m.homeTeam.code}
                    </span>
                    <span className="text-obsidian-muted text-[10px]">vs</span>
                    <span className="text-lg">{m.awayTeam.flag}</span>
                    <span className="text-[11px] font-bold text-obsidian-soft truncate">
                      {m.awayTeam.code}
                    </span>
                  </div>
                  <span className="text-[10px] text-obsidian-muted shrink-0 tabular-nums">
                    {new Date(m.kickoffISO).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
