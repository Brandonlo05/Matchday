import { useEffect } from 'react';

import { useAgeTierContext } from '../context/AgeTierContext';
import { useDayPlanner } from '../hooks/useDayPlanner';
import type { CityKey, PlanSlot } from '../types';

interface DayPlannerScreenProps {
  cityKey: CityKey;
  onClose: () => void;
  onSlotAction: (slot: PlanSlot) => void;
}

export function DayPlannerScreen({ cityKey, onClose, onSlotAction }: DayPlannerScreenProps) {
  const { ageTier } = useAgeTierContext();
  const tier = ageTier ?? 'adult';
  const { plan, swapSlot } = useDayPlanner(cityKey, tier);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      style={{ animation: 'fadeIn 180ms ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-label="Day planner"
    >
      <header className="flex-shrink-0 px-5 pt-safe pb-4 border-b border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-10 h-10 rounded-full bg-zinc-900 text-zinc-400 active:opacity-80 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Close planner"
        >
          ✕
        </button>
        <h1 className="text-[22px] font-black text-zinc-50 pr-12">
          Your Day in {plan.cityName}
        </h1>
        <p className="text-[13px] text-zinc-500 mt-1">{plan.date}</p>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-none px-5 py-6 pb-32">
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />

          {plan.slots.map((slot) => (
            <div key={slot.id} className="relative mb-6 last:mb-0">
              <div className="absolute -left-6 top-4 w-3 h-px bg-zinc-700" />
              <div className="absolute -left-[22px] top-3 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-2 ring-zinc-950" />

              <div
                className="rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex gap-3 items-start"
                style={{ animation: 'slideIn 180ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className="shrink-0 text-center w-12">
                  <span className="text-xl">{slot.timeEmoji}</span>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{slot.timeLabel}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-zinc-50 text-sm leading-tight">{slot.name}</h3>
                  <p className="text-[12px] text-zinc-400 mt-1 leading-snug">{slot.description}</p>
                </div>

                {slot.swappable && (
                  <button
                    type="button"
                    onClick={() => swapSlot(slot.id)}
                    className="shrink-0 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-700 px-2.5 py-2 rounded-lg active:opacity-80 touch-manipulation min-h-[44px] min-w-[44px]"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    Swap
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 px-5 pb-safe-modal pt-3 border-t border-zinc-800 bg-zinc-950">
        <button
          type="button"
          onClick={() => {
            const first = plan.slots[0];
            if (first) onSlotAction(first);
            onClose();
          }}
          className="w-full bg-emerald-500 text-zinc-950 font-bold py-4 rounded-xl active:scale-[0.97] touch-manipulation min-h-[52px] shadow-lg shadow-emerald-500/20"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Let&apos;s start →
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
