import type { GeoState } from '../../types';

interface EditorialCityHeaderProps {
  displayName: string;
  geo: GeoState;
  onTryNewCity: () => void;
  onRequestGeo?: () => void;
}

export function EditorialCityHeader({
  displayName,
  geo,
  onTryNewCity,
  onRequestGeo,
}: EditorialCityHeaderProps) {
  const geoLabel =
    geo.status === 'granted'
      ? 'Using your location'
      : geo.status === 'requesting'
      ? 'Locating…'
      : 'Set location for nearest picks';

  return (
    <header className="px-5 pt-6 pb-4">
      <p className="type-meta mb-3">Local discovery</p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="type-display text-[2.35rem] leading-[0.95] tracking-tight text-obsidian-text truncate">
            {displayName}
          </h1>
          <p className="text-[11px] text-obsidian-muted mt-3 tracking-wide">{geoLabel}</p>
        </div>

        <button
          type="button"
          onClick={onTryNewCity}
          className="shrink-0 px-4 py-2.5 rounded-full border-glass glass-panel text-[12px] font-semibold text-obsidian-soft active:opacity-80 touch-manipulation min-h-[44px]"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Try a new city
        </button>
      </div>

      {geo.status === 'idle' && onRequestGeo && (
        <button
          type="button"
          onClick={onRequestGeo}
          className="mt-4 text-[11px] font-semibold text-emerald-400/90 tracking-wide active:opacity-70 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Enable location →
        </button>
      )}
    </header>
  );
}
