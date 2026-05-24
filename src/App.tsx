// ============================================================
// Universal MatchDay Shovel — App.tsx (Wired Component Tree)
// Root shell that composes all 9 standalone components into
// the full mobile PWA experience.
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import { useMatchdayEngine } from './hooks/useMatchdayEngine';

// ── Component imports ─────────────────────────────────────────
import { NotificationRibbon } from './components/NotificationRibbon';
import { CityTabs }           from './components/CityTabs';
import type { CityTabItem }   from './components/CityTabs';
import { MatchCard }          from './components/MatchCard';
import { PubsSection }        from './components/PubsSection';
import { TransitHacks }       from './components/TransitHacks';
import { OrderAheadModal }    from './components/OrderAheadModal';
import { StickyFooterCapture } from './components/StickyFooterCapture';

// ── Type imports ──────────────────────────────────────────────
import type { Pub, Lead, Match, CityData } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type AppTab = 'venues' | 'schedule' | 'transit';

const LIVE_WINDOW_MS = 115 * 60 * 1000;

/** Returns true if any of a city's matches are inside the live window right now */
function cityHasLive(city: CityData): boolean {
  const now = Date.now();
  return city.matches.some((m) => {
    const diff = new Date(m.kickoffISO).getTime() - now;
    return diff < 0 && Math.abs(diff) < LIVE_WINDOW_MS;
  });
}

/** Count remaining (active + live) matches for a city */
function cityMatchCount(city: CityData): number {
  const now = Date.now();
  return city.matches.filter((m) =>
    new Date(m.kickoffISO).getTime() > now - LIVE_WINDOW_MS
  ).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// MINOR INLINE COMPONENTS (too small to deserve their own files)
// ─────────────────────────────────────────────────────────────────────────────

function GeoBanner({ status, onRequest }: { status: string; onRequest: () => void }) {
  if (status === 'granted' || status === 'requesting') return null;

  return (
    <div className="mx-4 mb-4 flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
      <span className="text-xl flex-shrink-0">📍</span>
      <p className="flex-1 text-xs text-zinc-400 leading-snug">
        {status === 'denied'
          ? 'Location access denied — showing all cities'
          : status === 'unsupported'
          ? 'Location not available in this browser'
          : 'Find the closest watch party venues to you'}
      </p>
      {status === 'idle' && (
        <button
          onClick={onRequest}
          className="bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform touch-manipulation flex-shrink-0"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Use Location
        </button>
      )}
    </div>
  );
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
        'mx-4 mb-2 flex items-center gap-3 rounded-xl px-4 py-3 border transition-all',
        isLive
          ? 'bg-emerald-950/50 border-emerald-500/30'
          : isFinal
          ? 'bg-yellow-950/30 border-yellow-500/20'
          : 'bg-zinc-900/60 border-zinc-800',
      ].join(' ')}
    >
      {/* Home flag */}
      <span className="text-2xl flex-shrink-0">{match.homeTeam.flag}</span>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-zinc-300 leading-none mb-0.5">
          {match.homeTeam.code}{' '}
          <span className="text-zinc-600 font-normal">vs</span>{' '}
          {match.awayTeam.code}
        </p>
        <p className="text-[10px] text-zinc-500">{match.phaseLabel}</p>
        {match.tvChannel && (
          <p className="text-[10px] text-zinc-600 mt-0.5">📺 {match.tvChannel}</p>
        )}
      </div>

      {/* Status / date */}
      <div className="text-right flex-shrink-0">
        {isLive ? (
          <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            LIVE
          </span>
        ) : (
          <>
            <p className="text-[11px] text-zinc-400 font-semibold">
              {kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[10px] text-zinc-600">
              {kickoff.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </>
        )}
      </div>

      {/* Away flag */}
      <span className="text-2xl flex-shrink-0">{match.awayTeam.flag}</span>
    </div>
  );
}

function NoMatchesState() {
  return (
    <div className="mx-4 py-12 flex flex-col items-center gap-3 text-center">
      <span className="text-5xl">🏁</span>
      <p className="text-zinc-400 font-semibold text-sm">All matches concluded</p>
      <p className="text-zinc-600 text-xs">No upcoming fixtures scheduled for this city</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const {
    cities,
    selectedCityId,
    selectedCity,
    upcomingMatches,
    nextMatch,
    countdown,
    geo,
    selectCity,
    requestGeo,
    saveLead,
  } = useMatchdayEngine();

  const [activeTab,  setActiveTab]  = useState<AppTab>('venues');
  const [modalPub,   setModalPub]   = useState<Pub | null>(null);

  // ── Derived city tab data ──────────────────────────────────

  const cityTabItems = useMemo<CityTabItem[]>(() =>
    cities.map((city) => ({
      id:           city.id,
      shortName:    city.shortName,
      emoji:        city.emoji,
      matchCount:   cityMatchCount(city),
      hasLiveMatch: cityHasLive(city),
    })),
    [cities]
  );

  // ── Modal handlers ─────────────────────────────────────────

  const handleOrderAhead  = useCallback((pub: Pub) => setModalPub(pub), []);
  const handleCloseModal  = useCallback(() => setModalPub(null), []);

  const handleLeadSubmit  = useCallback(
    (leadData: Omit<Lead, 'id' | 'createdAt' | 'status'>) => {
      saveLead(leadData);
    },
    [saveLead]
  );

  const handleReserveFirst = useCallback(() => {
    const first = selectedCity.pubs[0];
    if (first) handleOrderAhead(first);
  }, [selectedCity.pubs, handleOrderAhead]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {/*
       * Root container:
       * · relative → anchors StickyFooterCapture (absolute bottom-0)
       * · overflow-hidden → prevents content from bleeding outside 100dvh
       * · maxWidth 480 → phone-width column, centered on tablet/desktop
       */}
      <div
        className="relative flex flex-col bg-zinc-950 overflow-hidden"
        style={{ height: '100dvh', maxWidth: 480, margin: '0 auto' }}
      >
        {/* iOS safe-area top inset (notch / Dynamic Island) */}
        <div className="flex-shrink-0 pt-safe" />

        {/* ── 1. NOTIFICATION RIBBON ──────────────────────── */}
        <NotificationRibbon
          match={nextMatch}
          countdown={countdown}
          extraHeadlines={[
            '🍺 Tap "Reserve My Spot" to lock in your table before kickoff',
            '🚇 Tap Transit for step-by-step stadium travel guides',
          ]}
        />

        {/* ── 2. HEADER ────────────────────────────────────── */}
        <header className="flex-shrink-0 px-4 pt-3 pb-1">
          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-black tracking-tight leading-none">
              ⚽ MatchDay
              <span className="text-emerald-500">Shovel</span>
            </h1>
            <span className="text-[10px] text-zinc-600 font-semibold tracking-wide uppercase">
              FIFA World Cup 2026
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {selectedCity.displayName}
            {selectedCity.stadiums[0] && (
              <> · <span className="text-zinc-600">{selectedCity.stadiums[0].name}</span></>
            )}
          </p>
        </header>

        {/* ── 3. CITY TABS ─────────────────────────────────── */}
        <div className="flex-shrink-0 mt-1">
          <CityTabs
            cities={cityTabItems}
            selectedCityId={selectedCityId}
            onSelect={selectCity}
          />
        </div>

        {/* ── 4. SECTION TOGGLE (Venues / Schedule / Transit) ─ */}
        <div className="flex-shrink-0 flex gap-1 mx-4 mt-2 mb-1 bg-zinc-900 rounded-xl p-1">
          {(
            [
              { id: 'venues',   label: '🍺', text: 'Venues'   },
              { id: 'schedule', label: '📅', text: 'Schedule'  },
              { id: 'transit',  label: '🚇', text: 'Transit'   },
            ] as { id: AppTab; label: string; text: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold',
                'transition-all duration-150 touch-manipulation select-none',
                activeTab === tab.id
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 active:bg-zinc-800',
              ].join(' ')}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span>{tab.label}</span>
              <span>{tab.text}</span>
            </button>
          ))}
        </div>

        {/* ── 5. SCROLLABLE MAIN CONTENT ───────────────────── */}
        {/*
         * pb-36 gives 144px of bottom padding — enough to scroll
         * content past the StickyFooterCapture (≈ 120px tall).
         */}
        <main
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-none pb-36"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="pt-4">

            {/* Next match card — always visible above tab content */}
            {nextMatch ? (
              <div className="mx-4 mb-5">
                <p className="text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-2">
                  Next Match at {nextMatch.stadium.name}
                </p>
                <MatchCard
                  match={nextMatch}
                  countdown={countdown ?? undefined}
                  onWatchParty={handleReserveFirst}
                />
              </div>
            ) : (
              <NoMatchesState />
            )}

            {/* Geo banner */}
            <GeoBanner status={geo.status} onRequest={requestGeo} />

            {/* ── TAB: VENUES ─────────────────────────────── */}
            {activeTab === 'venues' && (
              <PubsSection
                pubs={selectedCity.pubs}
                onOrderAhead={handleOrderAhead}
              />
            )}

            {/* ── TAB: SCHEDULE ───────────────────────────── */}
            {activeTab === 'schedule' && (
              <div>
                <p className="px-4 mb-3 text-[10px] font-black text-zinc-600 tracking-widest uppercase">
                  {upcomingMatches.length} Upcoming Match{upcomingMatches.length !== 1 ? 'es' : ''}
                  {' · '}{selectedCity.displayName}
                </p>
                {upcomingMatches.length > 0
                  ? upcomingMatches.map((m) => (
                      <MatchScheduleRow key={m.id} match={m} />
                    ))
                  : <NoMatchesState />
                }
              </div>
            )}

            {/* ── TAB: TRANSIT ────────────────────────────── */}
            {activeTab === 'transit' && (
              <div className="px-4">
                <p className="mb-3 text-[10px] font-black text-zinc-600 tracking-widest uppercase">
                  Stadium Transit Guide · {selectedCity.stadiums[0]?.name}
                </p>
                <TransitHacks cityId={selectedCityId} />
              </div>
            )}

          </div>
        </main>

        {/* ── 6. STICKY FOOTER CTA ─────────────────────────── */}
        {/*
         * StickyFooterCapture is `absolute bottom-0` — it pins to
         * the bottom of this `relative` container, overlapping the
         * scrollable main with its gradient fade mask.
         */}
        <StickyFooterCapture
          nextMatch={nextMatch}
          countdown={countdown}
          onReserve={handleReserveFirst}
        />
      </div>

      {/* ── 7. ORDER AHEAD MODAL (portal-style overlay) ────── */}
      {modalPub && (
        <OrderAheadModal
          pub={modalPub}
          match={nextMatch}
          onClose={handleCloseModal}
          onSubmit={handleLeadSubmit}
        />
      )}
    </>
  );
}
