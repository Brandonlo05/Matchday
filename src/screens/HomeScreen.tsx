import { useEffect } from 'react';

import { EditorialCityHeader } from '../components/layout/EditorialCityHeader';
import { GlassPanel } from '../components/layout/GlassPanel';
import { FreeActivitiesSection } from '../components/FreeActivitiesSection';
import { PubsSection } from '../components/PubsSection';
import { CulinaryDirectory } from '../components/modules/CulinaryDirectory';
import { TransitHub } from '../components/modules/TransitHub';
import { LiveSportsCenter } from '../components/modules/LiveSportsCenter';
import { ParksTrailsDirectory } from '../components/modules/ParksTrailsDirectory';
import type { CityData, GeoState, Pub } from '../types';

interface HomeScreenProps {
  selectedCity: CityData;
  geo: GeoState;
  onTryNewCity: () => void;
  onRequestGeo: () => void;
  onOrderAhead: (pub: Pub) => void;
  onOpenPlanner: () => void;
}

export function HomeScreen({
  selectedCity,
  geo,
  onTryNewCity,
  onRequestGeo,
  onOrderAhead,
  onOpenPlanner,
}: HomeScreenProps) {
  useEffect(() => {
    if (geo.status === 'idle') {
      onRequestGeo();
    }
  }, [geo.status, onRequestGeo]);

  return (
    <div className="pb-28">
      <EditorialCityHeader
        displayName={selectedCity.displayName}
        geo={geo}
        onTryNewCity={onTryNewCity}
        onRequestGeo={onRequestGeo}
      />

      <div className="px-4 mb-6">
        <button
          type="button"
          onClick={onOpenPlanner}
          className="w-full glass-panel rounded-2xl border-glass px-4 py-4 flex items-center justify-between active:scale-[0.98] touch-manipulation min-h-[56px] transition-transform duration-200"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="flex items-center gap-3 text-left">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-bold text-obsidian-text text-sm">Plan My Day</p>
              <p className="text-[12px] text-obsidian-muted mt-0.5">
                One tap — full itinerary, zero forms
              </p>
            </div>
          </div>
          <span className="text-obsidian-muted text-lg">›</span>
        </button>
      </div>

      <section className="px-5 mb-2">
        <p className="type-meta">Tonight&apos;s move</p>
        <h2 className="type-display text-xl mt-1">Flash picks one spot</h2>
        <p className="text-[13px] text-obsidian-muted mt-2 leading-relaxed max-w-sm">
          Tap the lightning bolt — we choose, you act. No endless scrolling.
        </p>
      </section>

      <FreeActivitiesSection activities={selectedCity.freeActivities} />

      {/* City Intelligence · Little Rock */}
      <div className="mt-8">
        <div className="px-5 mb-4">
          <p className="type-meta">City Intelligence</p>
          <h2 className="type-display text-lg mt-1">Little Rock</h2>
        </div>
        <CulinaryDirectory />
        <TransitHub />
        <LiveSportsCenter />
        <ParksTrailsDirectory />
      </div>

      <div className="mt-2">
        <div className="px-5 mb-3">
          <p className="type-meta">Eat & drink</p>
          <h2 className="type-display text-lg mt-1">Local favorites</h2>
        </div>
        <PubsSection pubs={selectedCity.pubs} onOrderAhead={onOrderAhead} />
      </div>

      <div className="px-4 mt-8 mb-4">
        <GlassPanel className="rounded-2xl p-4">
          <p className="text-[12px] text-obsidian-muted leading-relaxed">
            Matchday Shovel learns your city from GPS when allowed. Everything here is curated
            for actually going out — not algorithmic noise.
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
