// ============================================================
// Universal MatchDay Shovel — App.tsx (Phase 2 Wired)
// AgeTierProvider wraps everything. AgeTierGate blocks until
// tier is selected. Flash FAB always visible. DayPlanner card
// between MatchCard and GeoBanner. FreeActivitiesSection in
// venues tab. useHistoricalPulse passive hook wired.
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import { useMatchdayEngine }       from './hooks/useMatchdayEngine';
import { useHistoricalPulse }      from './hooks/useHistoricalPulse';
import { AgeTierProvider }         from './context/AgeTierContext';
import { useAgeTierContext }        from './context/AgeTierContext';

// ── Component imports ─────────────────────────────────────────
import { NotificationRibbon }     from './components/NotificationRibbon';
import { CityTabs }               from './components/CityTabs';
import type { CityTabItem }       from './components/CityTabs';
import { MatchCard }              from './components/MatchCard';
import { PubsSection }            from './components/PubsSection';
import { TransitHacks }           from './components/TransitHacks';
import { OrderAheadModal }        from './components/OrderAheadModal';
import { StickyFooterCapture }    from './components/StickyFooterCapture';
import { AgeTierGate }            from './components/AgeTierGate';
import { FreeActivitiesSection }  from './components/FreeActivitiesSection';
import { FlashScreen }            from './components/FlashScreen';
import { DayPlannerScreen }       from './components/DayPlannerScreen';

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
// MINOR INLINE COMPONENTS
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
      <span className="text-2xl flex-shrink-0">{match.homeTeam.flag}</span>

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

// ─── Plan My Day entry card ────────────────────────────────────

function PlanMyDayCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-4 mb-4">
      <button
        onClick={onOpen}
        className="w-full bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between active:scale-[0.98] active:bg-zinc-800 transition-all touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="text-left">
          <p className="text-xs font-black text-zinc-100 leading-none mb-0.5">
            📅 Plan My Day
          </p>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Zero decisions. Full day sorted.
          </p>
        </div>
        <span className="text-emerald-500 text-sm font-bold ml-4">Open →</span>
      </button>
    </div>
  );
}

// ─── Flash FAB ────────────────────────────────────────────────

function FlashFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Flash — one confident pick"
      className="fixed flex items-center justify-center rounded-full shadow-xl active:scale-90 transition-transform touch-manipulation"
      style={{
        bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        right: 24,
        width: 56,
        height: 56,
        zIndex: 35,
        backgroundColor: 'rgb(16,185,129)',
        boxShadow: '0 4px 24px rgba(16,185,129,0.45)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: 26, height: 26, color: 'rgb(2,6,23)' }}
        aria-hidden="true"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INNER APP (reads from AgeTierContext — must be inside provider)
// ─────────────────────────────────────────────────────────────────────────────

function InnerApp() {
  const { hasSelected, ageTier } = useAgeTierContext();

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

  // Passive historical pulse — fires native notifications near pins
  useHistoricalPulse(selectedCityId);

  const [activeTab,     setActiveTab]     = useState<AppTab>('venues');
  const [modalPub,      setModalPub]      = useState<Pub | null>(null);
  const [flashOpen,     setFlashOpen]     = useState(false);
  const [plannerOpen,   setPlannerOpen]   = useState(false);

  // ── Derived city tab data ────────────────────────────────────

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

  // ── Modal / overlay handlers ─────────────────────────────────

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

  // Flash → pub reservation: look up pub by id and open modal
  const handleFlashPubReserve = useCallback((pubId: string) => {
    const pub = selectedCity.pubs.find((p) => p.id === pubId);
    if (pub) {
      setFlashOpen(false);
      setModalPub(pub);
    }
  }, [selectedCity.pubs]);

  // DayPlanner → pub reservation
  const handlePlannerPubReserve = useCallback((pubId: string) => {
    const pub = selectedCity.pubs.find((p) => p.id === pubId);
    if (pub) {
      setPlannerOpen(false);
      setModalPub(pub);
    }
  }, [selectedCity.pubs]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <>
      {/* Age tier gate — renders over everything until tier selected */}
      <AgeTierGate />

      {/*
       * Root container:
       * · relative → anchors StickyFooterCapture (absolute bottom-0)
       * · overflow-hidden → prevents content from bleeding outside 100dvh
       * · maxWidth 480 → phone-width column, centered on tablet/desktop
       * · pointer-events: none when gate is visible prevents interaction
       */}
      <div
        className="relative flex flex-col bg-zinc-950 overflow-hidden"
        style={{
          height: '100dvh',
          maxWidth: 480,
          margin: '0 auto',
          pointerEvents: hasSelected ? 'auto' : 'none',
        }}
      >
        {/* iOS safe-area top inset */}
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

            {/* Day Planner entry card — between MatchCard and GeoBanner */}
            <PlanMyDayCard onOpen={() => setPlannerOpen(true)} />

            {/* Geo banner */}
            <GeoBanner status={geo.status} onRequest={requestGeo} />

            {/* ── TAB: VENUES ─────────────────────────────── */}
            {activeTab === 'venues' && (
              <>
                <PubsSection
                  pubs={selectedCity.pubs}
                  onOrderAhead={handleOrderAhead}
                />
                <FreeActivitiesSection
                  activities={selectedCity.freeActivities}
                />
              </>
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
        <StickyFooterCapture
          nextMatch={nextMatch}
          countdown={countdown}
          onReserve={handleReserveFirst}
        />
      </div>

      {/* ── 7. FLASH FAB — fixed, always visible ─────────────── */}
      {hasSelected && (
        <FlashFAB onClick={() => setFlashOpen(true)} />
      )}

      {/* ── 8. ORDER AHEAD MODAL ─────────────────────────────── */}
      {modalPub && (
        <OrderAheadModal
          pub={modalPub}
          match={nextMatch}
          onClose={handleCloseModal}
          onSubmit={handleLeadSubmit}
        />
      )}

      {/* ── 9. FLASH SCREEN ──────────────────────────────────── */}
      {flashOpen && (
        <FlashScreen
          cityKey={selectedCityId}
          onClose={() => setFlashOpen(false)}
          onPubReserve={handleFlashPubReserve}
        />
      )}

      {/* ── 10. DAY PLANNER SCREEN ───────────────────────────── */}
      {plannerOpen && (
        <DayPlannerScreen
          cityKey={selectedCityId}
          onClose={() => setPlannerOpen(false)}
          onPubReserve={handlePlannerPubReserve}
        />
      )}

      {/* Suppress unused ageTier lint warning — value used by children */}
      {ageTier === null && null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — AgeTierProvider is the outermost wrapper
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AgeTierProvider>
      <InnerApp />
    </AgeTierProvider>
  );
}
