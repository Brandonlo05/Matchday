// ============================================================
// MatchDay Shovel — Root shell (Home + Matchday navigation)
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import { AgeTierProvider, useAgeTierContext } from './context/AgeTierContext';
import { AIProfileProvider, useAIProfile } from './context/AIUserContext';
import { useMatchdayEngine } from './hooks/useMatchdayEngine';
import { useHistoricalPulse } from './hooks/useHistoricalPulse';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';

import { AgeTierGate } from './components/AgeTierGate';
import { OrderAheadModal } from './components/OrderAheadModal';
import { FlashScreen } from './components/FlashScreen';
import { DayPlannerScreen } from './components/DayPlannerScreen';
import { StickyFooterCapture } from './components/StickyFooterCapture';
import { BottomNav } from './components/layout/BottomNav';
import { CityPickerSheet } from './components/layout/CityPickerSheet';
import { FlashFab } from './components/layout/FlashFab';
import { HomeScreen } from './screens/HomeScreen';
import { MatchdayScreen } from './screens/MatchdayScreen';

import type { CityTabItem } from './components/CityTabs';
import type { Pub, Lead, CityData, PlanSlot, RootNavTab } from './types';

const LIVE_WINDOW_MS = 115 * 60 * 1000;

function cityHasLive(city: CityData): boolean {
  const now = Date.now();
  return city.matches.some((m) => {
    const diff = new Date(m.kickoffISO).getTime() - now;
    return diff < 0 && Math.abs(diff) < LIVE_WINDOW_MS;
  });
}

function cityMatchCount(city: CityData): number {
  const now = Date.now();
  return city.matches.filter(
    (m) => new Date(m.kickoffISO).getTime() > now - LIVE_WINDOW_MS,
  ).length;
}

function MatchdayApp() {
  const { hasSelected } = useAgeTierContext();
  const { profile } = useAIProfile();
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

  const [rootTab, setRootTab] = useState<RootNavTab>('home');
  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const [modalPub, setModalPub] = useState<Pub | null>(null);
  const [flashOpen, setFlashOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);

  useHistoricalPulse(selectedCityId);

  const cityTabItems = useMemo<CityTabItem[]>(
    () =>
      cities.map((city) => ({
        id: city.id,
        shortName: city.shortName,
        emoji: city.emoji,
        matchCount: cityMatchCount(city),
        hasLiveMatch: cityHasLive(city),
      })),
    [cities],
  );

  const handleOrderAhead = useCallback((pub: Pub) => setModalPub(pub), []);

  const openOrderByPubId = useCallback(
    (pubId: string) => {
      const pub = selectedCity.pubs.find((p) => p.id === pubId);
      if (pub) setModalPub(pub);
      setFlashOpen(false);
    },
    [selectedCity.pubs],
  );

  const handleCloseModal = useCallback(() => setModalPub(null), []);

  const handleLeadSubmit = useCallback(
    (leadData: Omit<Lead, 'id' | 'createdAt' | 'status'>) => {
      saveLead(leadData);
    },
    [saveLead],
  );

  const handleReserveFirst = useCallback(() => {
    const first = selectedCity.pubs[0];
    if (first) handleOrderAhead(first);
  }, [selectedCity.pubs, handleOrderAhead]);

  const handlePlannerSlotAction = useCallback(
    (slot: PlanSlot) => {
      if (slot.actionUrl.startsWith('order:')) {
        openOrderByPubId(slot.actionUrl.replace('order:', ''));
      } else if (slot.actionUrl.startsWith('maps:')) {
        const q = decodeURIComponent(slot.actionUrl.replace('maps:', ''));
        window.open(`https://maps.google.com/?q=${q}`, '_blank', 'noopener,noreferrer');
      }
    },
    [openOrderByPubId],
  );

  if (!hasSelected) {
    return <AgeTierGate />;
  }

  if (!profile.onboardingComplete) {
    return <OnboardingWizard onComplete={() => {}} />;
  }

  return (
    <>
      <div
        className="relative flex flex-col bg-obsidian overflow-hidden cinematic-grain"
        style={{ height: '100dvh', maxWidth: 480, margin: '0 auto' }}
      >
        <div className="flex-shrink-0 pt-safe" />

        <main
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-none"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: rootTab === 'matchday' ? '9.5rem' : '5.5rem',
          }}
        >
          {rootTab === 'home' ? (
            <HomeScreen
              selectedCity={selectedCity}
              geo={geo}
              onTryNewCity={() => setCitySheetOpen(true)}
              onRequestGeo={requestGeo}
              onOrderAhead={handleOrderAhead}
              onOpenPlanner={() => setPlannerOpen(true)}
            />
          ) : (
            <MatchdayScreen
              selectedCity={selectedCity}
              selectedCityId={selectedCityId}
              upcomingMatches={upcomingMatches}
              nextMatch={nextMatch}
              countdown={countdown}
              onOrderAhead={handleOrderAhead}
              onOpenPlanner={() => setPlannerOpen(true)}
            />
          )}
        </main>

        {rootTab === 'matchday' && (
          <StickyFooterCapture
            nextMatch={nextMatch}
            countdown={countdown}
            onReserve={handleReserveFirst}
          />
        )}

        <BottomNav active={rootTab} onChange={setRootTab} />

        <FlashFab onOpen={() => setFlashOpen(true)} />
      </div>

      <CityPickerSheet
        open={citySheetOpen}
        cities={cityTabItems}
        selectedCityId={selectedCityId}
        onSelect={selectCity}
        onClose={() => setCitySheetOpen(false)}
      />

      {modalPub && (
        <OrderAheadModal
          pub={modalPub}
          match={nextMatch}
          onClose={handleCloseModal}
          onSubmit={handleLeadSubmit}
        />
      )}

      {flashOpen && (
        <FlashScreen
          cityKey={selectedCityId}
          onClose={() => setFlashOpen(false)}
          onOrderAhead={openOrderByPubId}
        />
      )}

      {plannerOpen && (
        <DayPlannerScreen
          cityKey={selectedCityId}
          onClose={() => setPlannerOpen(false)}
          onSlotAction={handlePlannerSlotAction}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AIProfileProvider>
      <AgeTierProvider>
        <MatchdayApp />
      </AgeTierProvider>
    </AIProfileProvider>
  );
}
