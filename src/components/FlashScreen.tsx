// ============================================================
// FlashScreen.tsx
// Full-screen Flash overlay. One recommendation at a time.
// Swipe left to skip, swipe right (or primary CTA) to act.
// Touch drag: card follows finger with translate + rotate.
// After 5 right swipes total: trained toast fires once.
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useFlash }            from '../hooks/useFlash';
import { useSwipePreferences } from '../hooks/useSwipePreferences';
import { useAgeTierContext }   from '../context/AgeTierContext';
import { CoinFlip }            from './CoinFlip';
import type { CityId, FlashResult } from '../types';

// ─── Swipe toast ──────────────────────────────────────────────

function TrainedToast({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-28 left-1/2 z-[60] -translate-x-1/2"
      style={{ animation: 'toastUp 0.25s ease-out forwards' }}
    >
      <div className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">
        Your Flash picks just got smarter ✓
      </div>
      <style>{`
        @keyframes toastUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────

interface CardProps {
  result: FlashResult;
  onRight: () => void;
  onLeft:  () => void;
  entering?: 'from-right' | 'from-left';
  exiting?:  'to-right'   | 'to-left';
}

function FlashCard({ result, onRight, onLeft, entering, exiting }: CardProps) {
  const touchStartX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Animation state
  let animStyle: React.CSSProperties = {};
  if (entering === 'from-right') {
    animStyle = { animation: 'cardInFromRight 0.18s ease-out forwards' };
  } else if (entering === 'from-left') {
    animStyle = { animation: 'cardInFromLeft 0.18s ease-out forwards' };
  } else if (exiting === 'to-right') {
    animStyle = { animation: 'cardOutToRight 0.22s ease-out forwards' };
  } else if (exiting === 'to-left') {
    animStyle = { animation: 'cardOutToLeft 0.22s ease-out forwards' };
  } else if (isDragging) {
    const rot = (dragX / 300) * 12;
    animStyle = {
      transform: `translateX(${dragX}px) rotate(${rot}deg)`,
    };
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = (e.touches[0]?.clientX ?? 0) - touchStartX.current;
    setDragX(dx);
  }

  function handleTouchEnd() {
    setIsDragging(false);
    if (dragX > 80)  { setDragX(0); onRight(); }
    else if (dragX < -80) { setDragX(0); onLeft();  }
    else { setDragX(0); }
    touchStartX.current = null;
  }

  const leftOpacity  = Math.min(1, Math.abs(Math.min(dragX, 0)) / 80);
  const rightOpacity = Math.min(1, Math.max(dragX, 0) / 80);

  return (
    <div
      className="mx-6 bg-zinc-900 ring-1 ring-zinc-800 rounded-3xl p-6 relative select-none"
      style={animStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left indicator */}
      <div
        className="absolute top-5 left-5 text-2xl pointer-events-none"
        style={{ opacity: leftOpacity, transition: isDragging ? 'none' : 'opacity 0.15s' }}
      >
        <span className="text-zinc-500">✕</span>
      </div>

      {/* Right indicator */}
      <div
        className="absolute top-5 right-5 text-2xl pointer-events-none"
        style={{ opacity: rightOpacity, transition: isDragging ? 'none' : 'opacity 0.15s' }}
      >
        <span className="text-emerald-400">♥</span>
      </div>

      {/* ⚡ FLASH label */}
      <p className="text-[10px] font-black text-emerald-500 tracking-widest uppercase mb-3">
        ⚡ FLASH
      </p>

      {/* Venue name */}
      <h2 className="text-[26px] font-black text-zinc-100 leading-tight mb-2">
        {result.name}
      </h2>

      {/* Context reason */}
      <p className="text-sm text-zinc-400 italic mb-3 leading-snug">
        {result.contextReason}
      </p>

      {/* Distance pill */}
      <div className="inline-flex items-center gap-1.5 bg-zinc-800 rounded-full px-3 py-1.5 mb-3">
        <span className="text-xs text-zinc-500">📍</span>
        <span className="text-xs text-zinc-400 font-medium">{result.distanceLabel}</span>
      </div>

      {/* Vibe / description */}
      <p className="text-sm text-zinc-300 leading-snug mb-5">{result.vibeOrDescription}</p>

      {/* Divider */}
      <div className="border-t border-zinc-800 mb-4" />

      {/* Primary CTA */}
      <button
        onClick={onRight}
        className="w-full bg-emerald-500 text-zinc-950 font-bold text-sm rounded-xl active:scale-[0.97] active:bg-emerald-400 transition-all touch-manipulation shadow-lg shadow-emerald-500/20"
        style={{ height: 52, WebkitTapHighlightColor: 'transparent' }}
      >
        {result.primaryActionLabel}
      </button>

      {/* Secondary — swipe for another */}
      <button
        onClick={onLeft}
        className="w-full ring-1 ring-zinc-700 text-zinc-300 font-bold text-sm rounded-xl mt-2 active:scale-[0.97] active:opacity-80 transition-all touch-manipulation"
        style={{ height: 44, WebkitTapHighlightColor: 'transparent' }}
      >
        Swipe for another →
      </button>

      {/* Tertiary — coin flip */}
      <div className="mt-3">
        <CoinFlip
          venueName={result.name}
          onPrimaryAction={onRight}
          onSwipeNext={onLeft}
          maxFlips={3}
        />
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────

interface Props {
  cityKey:        CityId;
  onClose:        () => void;
  onPubReserve:   (pubId: string) => void;
}

type AnimDir = 'from-right' | 'from-left' | 'to-right' | 'to-left' | null;

export function FlashScreen({ cityKey, onClose, onPubReserve }: Props) {
  const { ageTier }                             = useAgeTierContext();
  const { getFlash }                            = useFlash();
  const { recordSwipe, getLeftSwipedIds, swipeCount } = useSwipePreferences();

  const [sessionIndex, setSessionIndex] = useState(0);
  const [current, setCurrent]           = useState<FlashResult | null>(null);
  const [exitDir, setExitDir]           = useState<AnimDir>(null);
  const [enterDir, setEnterDir]         = useState<AnimDir>(null);
  const [showToast, setShowToast]       = useState(false);
  const toastShownRef                   = useRef(false);

  const prevSwipeCount = useRef(swipeCount);

  // Load initial card
  useEffect(() => {
    const excluded = getLeftSwipedIds();
    const flash = getFlash(cityKey, ageTier ?? 'adult', excluded, sessionIndex);
    setCurrent(flash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trained toast check
  useEffect(() => {
    if (
      swipeCount > prevSwipeCount.current &&
      swipeCount % 5 === 0 &&
      !toastShownRef.current
    ) {
      toastShownRef.current = true;
      setShowToast(true);
    }
    prevSwipeCount.current = swipeCount;
  }, [swipeCount]);

  // Keyboard escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const advance = useCallback((direction: 'left' | 'right') => {
    if (!current) return;
    recordSwipe(current.id, direction, current.type, cityKey);

    const exitAnim: AnimDir = direction === 'right' ? 'to-right' : 'to-left';
    setExitDir(exitAnim);

    setTimeout(() => {
      setExitDir(null);
      const nextIdx = sessionIndex + 1;
      setSessionIndex(nextIdx);
      const excluded = getLeftSwipedIds();
      const next = getFlash(cityKey, ageTier ?? 'adult', excluded, nextIdx);
      setCurrent(next);
      setEnterDir(direction === 'right' ? 'from-left' : 'from-right');
      setTimeout(() => setEnterDir(null), 200);
    }, 200);
  }, [current, sessionIndex, cityKey, ageTier, recordSwipe, getLeftSwipedIds, getFlash]);

  const handleRight = useCallback(() => {
    if (!current) return;
    if (current.type === 'pub') {
      const pubId = current.primaryActionUrl.replace('pub://', '');
      onPubReserve(pubId);
      advance('right');
    } else {
      window.open(current.primaryActionUrl, '_blank', 'noopener');
      advance('right');
    }
  }, [current, onPubReserve, advance]);

  const handleLeft = useCallback(() => advance('left'), [advance]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
      style={{ animation: 'flashFadeIn 0.18s ease-out forwards' }}
      role="dialog"
      aria-modal="true"
      aria-label="Flash recommendation"
    >
      <style>{`
        @keyframes flashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardInFromRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardInFromLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardOutToRight {
          from { opacity: 1; transform: translateX(0) rotate(0deg); }
          to   { opacity: 0; transform: translateX(120px) rotate(12deg); }
        }
        @keyframes cardOutToLeft {
          from { opacity: 1; transform: translateX(0) rotate(0deg); }
          to   { opacity: 0; transform: translateX(-120px) rotate(-12deg); }
        }
      `}</style>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-safe pt-4 pb-3 border-b border-zinc-900">
        <div>
          <p className="text-xs font-black text-emerald-500 tracking-widest uppercase">Flash</p>
          <p className="text-[11px] text-zinc-500">One pick. Act or swipe.</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-zinc-900 ring-1 ring-zinc-800 text-zinc-400 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Close Flash"
        >
          ✕
        </button>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden pb-24">
        {current ? (
          <div className="w-full max-w-sm">
            <FlashCard
              result={current}
              onRight={handleRight}
              onLeft={handleLeft}
              entering={enterDir as ('from-right' | 'from-left') ?? undefined}
              exiting={exitDir as ('to-right' | 'to-left') ?? undefined}
            />
          </div>
        ) : (
          <div className="text-center px-8">
            <p className="text-5xl mb-4">🏁</p>
            <p className="text-zinc-300 font-bold">You've seen everything.</p>
            <p className="text-zinc-600 text-sm mt-1">Come back later for fresh picks.</p>
          </div>
        )}
      </div>

      {/* Bottom swipe buttons */}
      <div className="flex-shrink-0 flex items-center justify-center gap-8 pb-safe pb-8">
        <button
          onClick={handleLeft}
          className="w-14 h-14 rounded-full bg-zinc-800 ring-1 ring-zinc-700 flex items-center justify-center active:scale-90 transition-transform touch-manipulation text-xl"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Skip"
        >
          <span className="text-zinc-400">✕</span>
        </button>
        <button
          onClick={handleRight}
          className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform touch-manipulation text-xl ring-1 ring-emerald-500/40"
          style={{
            backgroundColor: 'rgba(16,185,129,0.1)',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="I'm in"
        >
          <span className="text-emerald-400">♥</span>
        </button>
      </div>

      {/* Trained toast */}
      {showToast && <TrainedToast onDone={() => setShowToast(false)} />}
    </div>
  );
}
