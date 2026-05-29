import { useState } from 'react';

import { NotificationRibbon } from '../components/NotificationRibbon';
import { MatchCard } from '../components/MatchCard';
import { PubsSection } from '../components/PubsSection';
import { TransitHacks } from '../components/TransitHacks';
import { TournamentBracket } from '../components/matchday/TournamentBracket';
import { GlassPanel } from '../components/layout/GlassPanel';
import type {
  CityData,
  CityId,
  CountdownState,
  Match,
  MatchdaySubTab,
  Pub,
} from '../types';

const LIVE_WINDOW_MS = 115 * 60 * 1000;

interface MatchdayScreenProps {
  selectedCity: CityData;
  selectedCityId: CityId;
  upcomingMatches: Match[];
  nextMatch: Match | null;
  countdown: CountdownState | null;
  onOrderAhead: (pub: Pub) => void;
  onOpenPlanner: () => void;
}

function MatchScheduleRow({ match }: { match: Match }) {
  const kickoff = new Date(match.kickoffISO);
  const now = Date.now();
  const diff = kickoff.getTime() - now;
  const isLive = diff < 0 && Math.abs(diff) < LIVE_WINDOW_MS;
  const isFinal = match.phase === 'final';

  return (
    <div
      className={[
        'mx-4 mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 border touch-manipulation',
        isLive
          ? 'border-emerald-500/30 bg-emerald-500/8 glass-panel'
          : isFinal
          ? 'border-amber-500/25 bg-amber-500/5 glass-panel'
          : 'border-glass glass-panel',
      ].join(' ')}
    >
      <span className="text-2xl flex-shrink-0">{match.homeTeam.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-obsidian-soft leading-none mb-0.5">
          {match.homeTeam.code}{' '}
          <span className="text-obsidian-muted font-normal">vs</span>{' '}
          {match.awayTeam.code}
        </p>
        <p className="text-[10px] text-obsidian-muted">{match.phaseLabel}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {isLive ? (
          <span className="text-[10px] font-black text-emerald-400">LIVE</span>
        ) : (
          <p className="text-[10px] text-obsidian-muted tabular-nums">
            {kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
      <span className="text-2xl flex-shrink-0">{match.awayTeam.flag}</span>
    </div>
  );
}

export function MatchdayScreen({
  selectedCity,
  selectedCityId,
  upcomingMatches,
  nextMatch,
  countdown,
  onOrderAhead,
  onOpenPlanner,
}: MatchdayScreenProps) {
  const [subTab, setSubTab] = useState<MatchdaySubTab>('watch');

  return (
    <div className="pb-36">
      <header className="px-5 pt-5 pb-2">
        <p className="type-meta text-amber-400/80">FIFA World Cup 2026</p>
        <h1 className="type-display text-[2rem] leading-none mt-2 text-obsidian-text">
          Matchday
        </h1>
        <p className="text-[12px] text-obsidian-muted mt-2 tracking-wide">
          {selectedCity.stadiums[0]?.name ?? selectedCity.displayName}
        </p>
      </header>

      <NotificationRibbon
        match={nextMatch}
        countdown={countdown}
        extraHeadlines={[
          'Reserve ahead — walk in, skip the line',
          'Transit vectors update on matchday',
        ]}
      />

      {nextMatch ? (
        <div className="mx-4 mt-4 mb-4">
          <p className="type-meta mb-2">Next kickoff</p>
          <MatchCard
            match={nextMatch}
            countdown={countdown ?? undefined}
            onWatchParty={() => {
              const first = selectedCity.pubs[0];
              if (first) onOrderAhead(first);
            }}
          />
        </div>
      ) : (
        <GlassPanel className="mx-4 my-6 p-8 text-center rounded-2xl">
          <p className="text-obsidian-muted text-sm">No upcoming fixtures in this city.</p>
        </GlassPanel>
      )}

      <div className="px-4 mb-4">
        <button
          type="button"
          onClick={onOpenPlanner}
          className="w-full glass-panel border-glass rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="text-xl">📅</span>
          <span className="text-sm font-semibold text-obsidian-soft">Matchday day plan</span>
          <span className="ml-auto text-obsidian-muted">›</span>
        </button>
      </div>

      <TournamentBracket
        matches={selectedCity.matches}
        cityLabel={selectedCity.shortName}
      />

      <div className="flex-shrink-0 flex gap-1 mx-4 mt-2 mb-3 glass-panel rounded-2xl p-1 border-glass">
        {(
          [
            { id: 'watch', label: 'Watch parties' },
            { id: 'schedule', label: 'Schedule' },
            { id: 'transit', label: 'Transit' },
          ] as { id: MatchdaySubTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={[
              'flex-1 py-2.5 rounded-xl text-[11px] font-bold tracking-wide min-h-[44px]',
              'touch-manipulation transition-all duration-200',
              subTab === tab.id
                ? 'bg-white/10 text-obsidian-text'
                : 'text-obsidian-muted active:opacity-70',
            ].join(' ')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'watch' && (
        <PubsSection pubs={selectedCity.pubs} onOrderAhead={onOrderAhead} />
      )}

      {subTab === 'schedule' && (
        <div>
          <p className="px-4 mb-3 type-meta">
            {upcomingMatches.length} fixtures · {selectedCity.displayName}
          </p>
          {upcomingMatches.map((m) => (
            <MatchScheduleRow key={m.id} match={m} />
          ))}
        </div>
      )}

      {subTab === 'transit' && (
        <div className="px-4">
          <p className="mb-3 type-meta">
            Stadium vectors · {selectedCity.stadiums[0]?.name}
          </p>
          <TransitHacks cityId={selectedCityId} />
        </div>
      )}
    </div>
  );
}
