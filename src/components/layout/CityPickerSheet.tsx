import { useEffect, useState } from 'react';

import type { CityId } from '../../types';
import type { CityTabItem } from '../CityTabs';

interface CityPickerSheetProps {
  open: boolean;
  cities: CityTabItem[];
  selectedCityId: CityId;
  onSelect: (id: CityId) => void;
  onClose: () => void;
}

export function CityPickerSheet({
  open,
  cities,
  selectedCityId,
  onSelect,
  onClose,
}: CityPickerSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close city picker"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a city"
        className="relative w-full max-w-md glass-sheet rounded-t-[1.75rem] border-glass border-b-0 pb-safe-modal"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        <div className="px-6 pb-2">
          <p className="type-meta mb-1">Explore</p>
          <h2 className="type-display text-[1.35rem] leading-tight">Choose your city</h2>
          <p className="text-[13px] text-obsidian-muted mt-2 leading-relaxed">
            Host markets for World Cup 2026 — local picks update instantly.
          </p>
        </div>

        <ul className="px-4 pb-4 max-h-[50vh] overflow-y-auto scrollbar-none space-y-2">
          {cities.map((city) => {
            const active = city.id === selectedCityId;
            return (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(city.id);
                    onClose();
                  }}
                  className={[
                    'w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left',
                    'border touch-manipulation min-h-[56px] transition-all duration-200',
                    active
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-glass glass-panel active:opacity-80',
                  ].join(' ')}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="text-2xl">{city.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-obsidian-text text-base">{city.shortName}</p>
                    <p className="text-[11px] text-obsidian-muted mt-0.5">
                      {city.matchCount} fixture{city.matchCount !== 1 ? 's' : ''}
                      {city.hasLiveMatch ? ' · live now' : ''}
                    </p>
                  </div>
                  {active && (
                    <span className="text-emerald-400 text-sm font-bold">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
