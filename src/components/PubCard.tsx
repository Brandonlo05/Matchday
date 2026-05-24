// ============================================================
// PubCard.tsx
// Premium venue card with pulsing LIVE OPEN dot, filterable
// feature tags, live geo distance, and deposit micro-detail.
// ============================================================

import type { Pub } from '../types';

// ─── Feature meta map ────────────────────────────────────────

export const FEATURE_META: Record<string, { label: string; emoji: string; filterTag: string }> = {
  outdoor_patio:    { label: 'Beer Garden',     emoji: '🌿', filterTag: '#BeerGarden'   },
  multiple_screens: { label: 'Big Screens',     emoji: '📺', filterTag: '#BigScreens'   },
  private_booths:   { label: 'Private Booths',  emoji: '🎯', filterTag: '#PrivateBooths'},
  standing_room:    { label: 'Standing Room',   emoji: '🧍', filterTag: '#StandingRoom' },
  vip_section:      { label: 'VIP Section',     emoji: '⭐', filterTag: '#VIP'          },
  full_kitchen:     { label: 'Full Menu',        emoji: '🍔', filterTag: '#FullMenu'    },
  craft_beer:       { label: 'Craft Beer',      emoji: '🍺', filterTag: '#CraftBeer'    },
  cocktail_bar:     { label: 'Cocktails',       emoji: '🍹', filterTag: '#Cocktails'    },
  watch_party_host: { label: 'Hosted Events',   emoji: '🎙️', filterTag: '#Hosted'       },
  fan_zone:         { label: 'Fan Zone',        emoji: '🏟️', filterTag: '#FanZone'      },
  food_packages:    { label: 'Food Packages',   emoji: '📦', filterTag: '#FoodPkgs'     },
  bottle_service:   { label: 'Bottle Service',  emoji: '🥂', filterTag: '#BottleSvc'    },
};

// ─── Helpers ─────────────────────────────────────────────────

function fmtDistance(km: number): string {
  if (km < 0.1) return 'Right here';
  if (km < 1)   return `${Math.round(km * 1000)} m away`;
  const miles = km * 0.621371;
  return `${km.toFixed(1)} km  ·  ${miles.toFixed(1)} mi`;
}

function fmtCurrency(amount: number, currency: 'USD' | 'MXN' | 'CAD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0,
  }).format(amount);
}

function priceDots(level: number): string {
  return '●'.repeat(level) + '○'.repeat(4 - level);
}

/** Returns true if the pub is plausibly "open" for a typical match time */
function isOpenNow(): boolean {
  const h = new Date().getHours();
  return h >= 10 && h < 3; // open 10am–3am
}

// ─── Props ───────────────────────────────────────────────────

interface Props {
  pub: Pub;
  activeFilters: string[];
  onOrderAhead: (pub: Pub) => void;
}

// ─── Live open dot ───────────────────────────────────────────

function LiveOpenDot() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[10px] font-bold text-emerald-400 tracking-wider">OPEN NOW</span>
    </span>
  );
}

// ─── Feature badge ───────────────────────────────────────────

function FeatureBadge({
  feature, active,
}: {
  feature: string;
  active: boolean;
}) {
  const meta = FEATURE_META[feature];
  if (!meta) return null;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all duration-150',
        active
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          : 'bg-zinc-800 border-zinc-700 text-zinc-500',
      ].join(' ')}
    >
      <span className="leading-none">{meta.emoji}</span>
      {meta.filterTag}
    </span>
  );
}

// ─── Rating stars ────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < full ? 'text-amber-400' :
            i === full && half ? 'text-amber-400/50' :
            'text-zinc-700'
          }
          style={{ fontSize: 11 }}
        >★</span>
      ))}
    </span>
  );
}

// ─── Main card ───────────────────────────────────────────────

export function PubCard({ pub, activeFilters, onOrderAhead }: Props) {
  const open = isOpenNow();
  const hasActiveFilter = activeFilters.some((f) => pub.features.includes(f as any));
  const highlighted = activeFilters.length === 0 || hasActiveFilter;

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all duration-300"
      style={{
        backgroundColor: 'rgb(24,24,27)',
        borderColor: highlighted ? 'rgba(63,63,70,1)' : 'rgba(39,39,42,0.5)',
        opacity: highlighted ? 1 : 0.45,
        transform: highlighted ? 'scale(1)' : 'scale(0.99)',
      }}
    >
      {/* Gradient header */}
      <div className={`relative h-24 bg-gradient-to-br ${pub.imageGradient} overflow-hidden`}>
        {/* Darken overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />

        {/* Top-left: neighborhood + name */}
        <div className="absolute bottom-0 left-0 px-4 pb-3">
          <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase leading-none mb-1">
            {pub.neighborhood}
          </p>
          <h3 className="text-zinc-100 font-black text-lg leading-tight">{pub.name}</h3>
        </div>

        {/* Top-right: ORDER AHEAD chip */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {pub.orderAheadAvailable && (
            <span className="bg-emerald-500 text-zinc-950 text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest shadow-lg">
              ORDER AHEAD ↗
            </span>
          )}
          {open && <LiveOpenDot />}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3 pb-1">
        {/* Tagline */}
        <p className="text-zinc-400 text-sm leading-snug mb-3">{pub.tagline}</p>

        {/* Stats row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mb-3">
          <span className="flex items-center gap-1.5">
            <Stars rating={pub.rating} />
            <span className="text-zinc-300 font-bold">{pub.rating.toFixed(1)}</span>
            <span className="text-zinc-600">({pub.reviewCount.toLocaleString()})</span>
          </span>

          <span className="text-zinc-700">·</span>

          <span className="text-zinc-500 tracking-widest font-mono text-[11px]">
            {priceDots(pub.priceLevel)}
          </span>

          <span className="text-zinc-700">·</span>

          <span className="text-zinc-500 text-[11px]">
            Up to {pub.capacity.toLocaleString()} guests
          </span>

          {pub.distanceKm != null && (
            <>
              <span className="text-zinc-700 hidden sm:inline">·</span>
              <span className="text-emerald-500/80 text-[11px] font-medium w-full sm:w-auto">
                📍 {fmtDistance(pub.distanceKm)}
              </span>
            </>
          )}
        </div>

        {/* Feature tags — show all, highlight active filters */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pub.features.map((f) => (
            <FeatureBadge
              key={f}
              feature={f}
              active={activeFilters.includes(f)}
            />
          ))}
        </div>

        {/* Deposit notice */}
        {pub.depositRequired && pub.depositAmount && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-500 text-sm">⚡</span>
            <p className="text-amber-400/80 text-[11px]">
              {fmtCurrency(pub.depositAmount, pub.currency)} deposit to lock your table
            </p>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="px-4 pb-4 flex gap-2">
        <a
          href={`tel:${pub.phone}`}
          className="flex-none flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-sm font-medium px-4 py-3 rounded-xl border border-zinc-700 active:scale-95 active:bg-zinc-700 transition-all touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          📞 <span className="hidden sm:inline">Call</span>
        </a>
        {pub.website && (
          <a
            href={pub.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-sm font-medium px-4 py-3 rounded-xl border border-zinc-700 active:scale-95 active:bg-zinc-700 transition-all touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            🌐
          </a>
        )}
        <button
          onClick={() => onOrderAhead(pub)}
          disabled={!pub.orderAheadAvailable}
          className={[
            'flex-1 font-bold text-sm py-3 rounded-xl transition-all touch-manipulation',
            pub.orderAheadAvailable
              ? 'bg-emerald-500 text-zinc-950 active:scale-[0.97] active:bg-emerald-400 shadow-lg shadow-emerald-500/20'
              : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed',
          ].join(' ')}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {pub.orderAheadAvailable ? 'Reserve My Spot →' : 'Walk-ins Only'}
        </button>
      </div>
    </div>
  );
}
