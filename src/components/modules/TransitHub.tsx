// ============================================================
// MatchDay — Transit Hub
// Pill-toggled transit, live status badges, Maps URL parser
// ============================================================

import { useState, useCallback } from 'react';
import { getNearestAvailableCity } from '../../data/cityDataRouter';
import type { CityIntelligenceData } from '../../data/cityDataRouter';

// ─── LOCAL TYPES ─────────────────────────────────────────────

type TransitOptionData = CityIntelligenceData['transitOptions'][number];
type TransitTab        = TransitOptionData['category'];

const TABS: TransitTab[] = ['Flash Rapid Selection', 'Free / Public Selection'];

// ─── LIVE STATUS HELPER ───────────────────────────────────────

interface TransitStatus {
  label: string;
  pulse: boolean;
}

function getTransitStatus(option: TransitOptionData): TransitStatus {
  const name = option.name.toLowerCase();
  const freq = option.frequency?.toLowerCase() ?? '';

  // Free services, named circuits, streetcars, and people-movers are always running
  if (
    option.fare === 'Free' ||
    name.includes('circuit') ||
    name.includes('streetcar') ||
    name.includes('metromover') ||
    name.includes('tram')
  ) {
    return { label: 'RUNNING NOW', pulse: true };
  }

  // On-demand services
  if (freq.includes('on-demand') || freq.includes('on demand')) {
    return { label: 'AVAILABLE NOW', pulse: false };
  }

  // Scheduled services — show frequency string
  if (option.frequency) {
    return { label: option.frequency, pulse: false };
  }

  return { label: '', pulse: false };
}

// ─── URL PARSER ───────────────────────────────────────────────

function parseLocationFromUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const q = parsed.searchParams.get('q');
    if (q !== null) return decodeURIComponent(q);
    const placeMatch = /\/place\/([^/]+)/.exec(parsed.pathname);
    if (placeMatch !== null && placeMatch[1] !== undefined) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }
    const address = parsed.searchParams.get('address');
    if (address !== null) return decodeURIComponent(address);
    return null;
  } catch {
    return null;
  }
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

// ─── TRANSIT CARD ────────────────────────────────────────────

interface TransitCardProps {
  option: TransitOptionData;
}

function TransitCard({ option }: TransitCardProps) {
  const status = getTransitStatus(option);

  return (
    <div className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-zinc-50 text-base">{option.name}</h3>
          <p className="text-sm text-zinc-400 mt-1 leading-snug">
            {option.description}
          </p>
          {/* Live status badge */}
          {status.label && (
            <div className="flex items-center gap-1.5 mt-2">
              {status.pulse && (
                <span className="block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              )}
              <span className="text-[10px] text-emerald-400 font-semibold">
                {status.label}
              </span>
            </div>
          )}
        </div>
        <span className="flex-shrink-0 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-full px-3 py-1 min-h-[28px] flex items-center">
          {option.fare}
        </span>
      </div>
    </div>
  );
}

// ─── TRANSIT HUB ─────────────────────────────────────────────

type ParseResult =
  | { status: 'idle' }
  | { status: 'found'; location: string }
  | { status: 'failed' };

interface TransitHubProps {
  cityKey: string;
}

export function TransitHub({ cityKey }: TransitHubProps) {
  const { data, isExact } = getNearestAvailableCity(cityKey);
  const [activeTab, setActiveTab] = useState<TransitTab>('Flash Rapid Selection');
  const [shareLink, setShareLink] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult>({ status: 'idle' });

  const filteredOptions = data.transitOptions.filter(
    (opt) => opt.category === activeTab,
  );

  const handleParse = useCallback(() => {
    if (!shareLink.trim()) { setParseResult({ status: 'idle' }); return; }
    const location = parseLocationFromUrl(shareLink);
    setParseResult(
      location !== null
        ? { status: 'found', location }
        : { status: 'failed' },
    );
  }, [shareLink]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleParse();
    },
    [handleParse],
  );

  return (
    <section className="pb-6">
      {!isExact && <NearestCityBanner />}

      <div className="px-4 mb-4">
        <p className="type-meta text-emerald-400/90">Getting around</p>
        <h2 className="type-display text-xl mt-1">Transit Hub</h2>
      </div>

      <div className="px-4">
        {/* ── Pill tabs ──────────────────────────────────────── */}
        <div className="flex gap-2 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 h-[44px] rounded-full text-xs font-bold transition-all duration-150 touch-manipulation px-2',
                activeTab === tab
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'glass-panel text-zinc-400',
              ].join(' ')}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Transit cards ─────────────────────────────────── */}
        <div className="space-y-3 mb-6">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <TransitCard key={option.id} option={option} />
            ))
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">
              No options in this category.
            </p>
          )}
        </div>

        {/* ── Paste Share Link card ─────────────────────────── */}
        <div className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
          <p className="type-meta mb-1">Share a location</p>
          <p className="text-sm text-zinc-500 mb-3 leading-snug">
            Paste a Google Maps or Apple Maps link to extract the location name.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={shareLink}
              onChange={(e) => {
                setShareLink(e.target.value);
                setParseResult({ status: 'idle' });
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste Maps URL here…"
              className="flex-1 h-[44px] rounded-xl bg-zinc-800 ring-1 ring-zinc-700 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
            />
            <button
              type="button"
              onClick={handleParse}
              className="h-[44px] px-5 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm touch-manipulation active:scale-[0.97] transition-transform flex-shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Parse
            </button>
          </div>
          {parseResult.status === 'found' && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">
                Location found
              </p>
              <p className="text-sm text-emerald-300 leading-snug">
                {parseResult.location}
              </p>
            </div>
          )}
          {parseResult.status === 'failed' && (
            <p className="text-xs text-amber-400 leading-snug">
              Could not parse location — try a direct Google Maps or Apple Maps share link.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
