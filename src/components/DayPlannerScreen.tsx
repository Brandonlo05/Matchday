// ============================================================
// DayPlannerScreen.tsx
// Full-screen day planner overlay. Zero-input itinerary.
// Vertical timeline layout. Slot-by-slot swap with slide-in.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useDayPlanner }       from '../hooks/useDayPlanner';
import { useAgeTierContext }   from '../context/AgeTierContext';
import type { CityId, PlanSlot } from '../types';

// ─── Single timeline slot ─────────────────────────────────────

interface SlotRowProps {
  slot:      PlanSlot;
  isLast:    boolean;
  onSwap:    (id: string) => void;
  animating: boolean;
}

function SlotRow({ slot, isLast, onSwap, animating }: SlotRowProps) {
  return (
    <div className="flex gap-0 relative">
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
        {/* Tick dot */}
        <div
          className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1"
          style={{
            borderColor: 'rgb(16,185,129)',
            backgroundColor: slot.swappable ? 'rgb(24,24,27)' : 'rgb(16,185,129)',
          }}
        />
        {/* Connecting line */}
        {!isLast && (
          <div className="w-px flex-1 bg-zinc-800 mt-1" style={{ minHeight: 24 }} />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 mb-4 ml-3"
        style={{
          animation: animating ? 'slotSlideIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
        }}
      >
        <div className="bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl px-4 py-3">
          {/* Time row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{slot.timeEmoji}</span>
              <span className="text-[11px] font-black text-zinc-500 tracking-widest uppercase">
                {slot.timeLabel}
              </span>
              {slot.swappable && (
                <span className="text-[9px] font-black text-zinc-700 tracking-widest uppercase bg-zinc-800 px-2 py-0.5 rounded-full">
                  PAST
                </span>
              )}
            </div>
            <button
              onClick={() => onSwap(slot.id)}
              className="text-[11px] font-bold text-zinc-500 ring-1 ring-zinc-700 px-3 py-1.5 rounded-xl active:scale-95 active:bg-zinc-800 transition-all touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Swap
            </button>
          </div>

          {/* Name + description */}
          <p className="text-sm font-bold text-zinc-100 leading-tight">{slot.name}</p>
          <p className="text-xs text-zinc-400 mt-1 leading-snug">{slot.description}</p>

          {/* Action link */}
          <a
            href={slot.actionUrl}
            target={slot.actionUrl.startsWith('pub://') ? '_self' : '_blank'}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold text-emerald-500 active:opacity-70 touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={slot.actionUrl.startsWith('pub://') ? (e) => e.preventDefault() : undefined}
          >
            {slot.actionLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────

interface Props {
  cityKey: CityId;
  onClose: () => void;
  /** Called when user taps a pub slot's action — open reservation modal */
  onPubReserve: (pubId: string) => void;
}

export function DayPlannerScreen({ cityKey, onClose, onPubReserve }: Props) {
  const { ageTier }        = useAgeTierContext();
  const { plan, swapSlot } = useDayPlanner(cityKey, ageTier ?? 'adult');

  const [animatingSlot, setAnimatingSlot] = useState<string | null>(null);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSwap = useCallback((slotId: string) => {
    swapSlot(slotId);
    setAnimatingSlot(slotId);
    setTimeout(() => setAnimatingSlot(null), 220);
  }, [swapSlot]);

  const handleSlotAction = useCallback((slot: PlanSlot) => {
    if (slot.actionUrl.startsWith('pub://')) {
      const pubId = slot.actionUrl.replace('pub://', '');
      onPubReserve(pubId);
    } else {
      window.open(slot.actionUrl, '_blank', 'noopener');
    }
  }, [onPubReserve]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      style={{ animation: 'plannerFadeIn 0.18s ease-out forwards' }}
      role="dialog"
      aria-modal="true"
      aria-label="Day planner"
    >
      <style>{`
        @keyframes plannerFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slotSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between px-5 pt-safe pt-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-[22px] font-black text-zinc-100 leading-tight">
            Your Day in {plan.cityName}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{plan.date}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-900 ring-1 ring-zinc-800 text-zinc-400 flex items-center justify-center active:scale-90 transition-transform touch-manipulation ml-4 mt-0.5"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Close planner"
        >
          ✕
        </button>
      </div>

      {/* Scrollable timeline */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-4"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {plan.slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-zinc-400 font-semibold">No plan available</p>
            <p className="text-zinc-600 text-sm mt-1">Try switching cities</p>
          </div>
        ) : (
          plan.slots.map((slot, i) => (
            <div key={slot.id} onClick={() => { if (slot.actionUrl.startsWith('pub://')) handleSlotAction(slot); }}>
              <SlotRow
                slot={slot}
                isLast={i === plan.slots.length - 1}
                onSwap={handleSwap}
                animating={animatingSlot === slot.id}
              />
            </div>
          ))
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="flex-shrink-0 px-5 py-4 border-t border-zinc-900 bg-zinc-950"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onClose}
          className="w-full bg-emerald-500 text-zinc-950 font-black text-base py-4 rounded-2xl active:scale-[0.97] active:bg-emerald-400 transition-all touch-manipulation shadow-lg shadow-emerald-500/20"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Let's start →
        </button>
      </div>
    </div>
  );
}
