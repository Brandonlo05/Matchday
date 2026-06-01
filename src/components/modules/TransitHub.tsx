// ============================================================
// MatchDay — Transit Hub (Little Rock)
// Pill-toggled transit options + client-side Maps URL parser
// ============================================================

import { useState, useCallback } from 'react';
import { littleRockData } from '../../data/littleRockData';
import type { LRTransitOption } from '../../data/littleRockData';

// ─── TYPES ───────────────────────────────────────────────────

type TransitTab = LRTransitOption['category'];

type ParseResult =
  | { status: 'idle' }
  | { status: 'found'; location: string }
  | { status: 'failed' };

// ─── URL PARSER ───────────────────────────────────────────────
// Checks ?q=, /place/, and address= in that priority order.

function parseLocationFromUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());

    // 1. Google Maps ?q= parameter
    const q = parsed.searchParams.get('q');
    if (q !== null) return decodeURIComponent(q);

    // 2. Google Maps /place/<name>/ path segment
    const placeMatch = /\/place\/([^/]+)/.exec(parsed.pathname);
    if (placeMatch !== null && placeMatch[1] !== undefined) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // 3. Apple Maps address= parameter
    const address = parsed.searchParams.get('address');
    if (address !== null) return decodeURIComponent(address);

    return null;
  } catch {
    // new URL() throws TypeError for invalid URLs
    return null;
  }
}

// ─── TRANSIT CARD ────────────────────────────────────────────

interface TransitCardProps {
  option: LRTransitOption;
}

function TransitCard({ option }: TransitCardProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-zinc-50 text-base">{option.name}</h3>
          <p className="text-sm text-zinc-400 mt-1 leading-snug">
            {option.description}
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-full px-3 py-1 min-h-[28px] flex items-center">
          {option.fare}
        </span>
      </div>
    </div>
  );
}

// ─── TRANSIT HUB ─────────────────────────────────────────────

const TABS: TransitTab[] = ['Flash Rapid Selection', 'Free / Public Selection'];

export function TransitHub() {
  const [activeTab, setActiveTab] = useState<TransitTab>('Flash Rapid Selection');
  const [shareLink, setShareLink] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult>({ status: 'idle' });

  const filteredOptions = littleRockData.transitOptions.filter(
    (opt) => opt.category === activeTab,
  );

  const handleParse = useCallback(() => {
    if (!shareLink.trim()) {
      setParseResult({ status: 'idle' });
      return;
    }
    const location = parseLocationFromUrl(shareLink);
    if (location !== null) {
      setParseResult({ status: 'found', location });
    } else {
      setParseResult({ status: 'failed' });
    }
  }, [shareLink]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleParse();
    },
    [handleParse],
  );

  return (
    <section className="px-4 pb-6">
      <div className="mb-4">
        <p className="type-meta text-emerald-400/90">Getting around</p>
        <h2 className="type-display text-xl mt-1">Transit Hub</h2>
      </div>

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
            Could not parse location — try a direct Google Maps or Apple Maps
            share link.
          </p>
        )}
      </div>
    </section>
  );
}
