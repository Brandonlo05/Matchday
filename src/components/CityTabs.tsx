// ============================================================
// CityTabs.tsx
// Horizontally scrollable city pill tabs with a sliding
// active-indicator underline and spring-like press feedback.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import type { CityId } from '../types';

export interface CityTabItem {
  id: CityId;
  shortName: string;
  emoji: string;
  matchCount: number;
  hasLiveMatch: boolean;
}

interface Props {
  cities: CityTabItem[];
  selectedCityId: CityId;
  onSelect: (id: CityId) => void;
}

export function CityTabs({ cities, selectedCityId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<CityId | null>(null);

  // Smooth-scroll the active pill into the horizontal center
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const idx = cities.findIndex((c) => c.id === selectedCityId);
    const pill = container.children[idx] as HTMLElement | undefined;
    if (!pill) return;

    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const scrollTarget =
      container.scrollLeft +
      (pillRect.left - containerRect.left) -
      (containerRect.width / 2 - pillRect.width / 2);

    container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
  }, [selectedCityId, cities]);

  return (
    <div
      className="relative"
      style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}
    >
      <div
        ref={scrollRef}
        className="flex gap-2 px-6 overflow-x-auto py-2"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {cities.map((city) => {
          const active = city.id === selectedCityId;
          const isPressed = pressed === city.id;

          return (
            <button
              key={city.id}
              onPointerDown={() => setPressed(city.id)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onClick={() => onSelect(city.id)}
              className="relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full select-none touch-manipulation outline-none"
              style={{
                WebkitTapHighlightColor: 'transparent',
                transform: isPressed ? 'scale(0.93)' : 'scale(1)',
                transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.18s ease, color 0.18s ease',
                backgroundColor: active ? 'rgb(16 185 129)' : 'rgb(39 39 42)',
                color: active ? 'rgb(9 9 11)' : 'rgb(161 161 170)',
                boxShadow: active ? '0 4px 20px rgba(16,185,129,0.3)' : 'none',
              }}
            >
              {/* City emoji */}
              <span className="text-[17px] leading-none">{city.emoji}</span>

              {/* City name */}
              <span className="text-sm font-bold tracking-wide whitespace-nowrap">
                {city.shortName}
              </span>

              {/* Live badge */}
              {city.hasLiveMatch && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: active ? 'rgb(9 9 11)' : 'rgb(16 185 129)' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: active ? 'rgb(9 9 11)' : 'rgb(16 185 129)' }}
                  />
                </span>
              )}

              {/* Match count pill (non-active only) */}
              {!active && city.matchCount > 0 && !city.hasLiveMatch && (
                <span className="text-[10px] font-black bg-zinc-700 text-zinc-400 rounded-full px-1.5 py-0.5 leading-none">
                  {city.matchCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
