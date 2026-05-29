import type { ReactNode } from 'react';

import type { RootNavTab } from '../../types';

interface BottomNavProps {
  active: RootNavTab;
  onChange: (tab: RootNavTab) => void;
}

const TABS: { id: RootNavTab; label: string; icon: (active: boolean) => ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.5}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'matchday',
    label: 'Matchday',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
        <path
          d="M8 12h8M12 8v8"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.6}
        />
        <path
          d="M6 6c2 1 4 1 6 0M18 18c-2-1-4-1-6 0"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.45}
        />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="flex-shrink-0 border-t border-glass px-2 pt-2 pb-safe-nav glass-nav"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-xl',
                'touch-manipulation min-h-[52px] transition-colors duration-200',
                isActive ? 'text-emerald-400' : 'text-obsidian-muted active:opacity-70',
              ].join(' ')}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span
                className={[
                  'flex items-center justify-center w-10 h-7 rounded-lg transition-all duration-200',
                  isActive ? 'bg-emerald-500/12' : '',
                ].join(' ')}
              >
                {tab.icon(isActive)}
              </span>
              <span
                className={[
                  'text-[10px] font-bold tracking-[0.12em] uppercase',
                  isActive ? 'text-emerald-400' : 'text-obsidian-muted',
                ].join(' ')}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+6px)] w-8 h-[2px] rounded-full bg-emerald-400/90" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
