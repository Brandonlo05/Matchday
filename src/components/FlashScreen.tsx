import { useCallback, useEffect, useRef, useState } from 'react';

import { useAgeTierContext } from '../context/AgeTierContext';
import { useFlash } from '../hooks/useFlash';
import { useSwipePreferences } from '../hooks/useSwipePreferences';
import type { CityKey, FlashResult } from '../types';
import { CoinFlip } from './CoinFlip';

interface FlashScreenProps {
  cityKey: CityKey;
  onClose: () => void;
  onOrderAhead: (pubId: string) => void;
}

const SWIPE_THRESHOLD = 80;

export function FlashScreen({ cityKey, onClose, onOrderAhead }: FlashScreenProps) {
  const { ageTier } = useAgeTierContext();
  const tier = ageTier ?? 'adult';
  const { recordSwipe, getLeftSwipedIds, swipeCount } = useSwipePreferences();
  const { getNext, resetSession } = useFlash(cityKey, tier, getLeftSwipedIds);

  const [card, setCard] = useState<FlashResult | null>(null);
  const [incoming, setIncoming] = useState<FlashResult | null>(null);
  const [visible, setVisible] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [coinFlips, setCoinFlips] = useState(0);
  const [toastShown, setToastShown] = useState(false);

  const startXRef = useRef(0);
  const draggingRef = useRef(false);

  const loadNext = useCallback(() => getNext(), [getNext]);

  useEffect(() => {
    resetSession();
    setCard(loadNext());
    requestAnimationFrame(() => setVisible(true));
  }, [cityKey, resetSession, loadNext]);

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

  useEffect(() => {
    if (swipeCount > 0 && swipeCount % 5 === 0 && !toastShown) {
      setShowToast(true);
      setToastShown(true);
      const t = window.setTimeout(() => setShowToast(false), 3000);
      return () => window.clearTimeout(t);
    }
  }, [swipeCount, toastShown]);

  const completeSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!card || animating) return;
      setAnimating(true);

      recordSwipe(card.id, direction, card.type, cityKey, card.name);

      if (direction === 'right') {
        if (card.primaryActionUrl.startsWith('order:')) {
          const pubId = card.pubId ?? card.primaryActionUrl.replace('order:', '');
          onOrderAhead(pubId);
        } else if (card.primaryActionUrl.startsWith('maps:')) {
          const q = decodeURIComponent(card.primaryActionUrl.replace('maps:', ''));
          window.open(`https://maps.google.com/?q=${q}`, '_blank', 'noopener,noreferrer');
        }
      }

      setDragX(direction === 'left' ? -400 : 400);

      const next = loadNext();
      setIncoming(next);

      window.setTimeout(() => {
        setCard(next);
        setIncoming(null);
        setDragX(0);
        setAnimating(false);
      }, 220);
    },
    [card, animating, recordSwipe, cityKey, onOrderAhead, loadNext],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    if (animating) return;
    startXRef.current = e.touches[0]?.clientX ?? 0;
    draggingRef.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current || animating) return;
    setDragX((e.touches[0]?.clientX ?? 0) - startXRef.current);
  };

  const onTouchEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragX > SWIPE_THRESHOLD) completeSwipe('right');
    else if (dragX < -SWIPE_THRESHOLD) completeSwipe('left');
    else setDragX(0);
  };

  const handlePrimary = () => {
    if (!card) return;
    completeSwipe('right');
  };

  const rotateZ = Math.max(-14, Math.min(14, dragX / 14));
  const rotateY = Math.max(-22, Math.min(22, dragX / 18));
  const rotateX = Math.max(-8, Math.min(8, -dragX / 45));
  const scale = 1 - Math.min(0.045, Math.abs(dragX) / 2200);
  const leftOpacity = Math.min(1, Math.abs(Math.min(0, dragX)) / SWIPE_THRESHOLD);
  const rightOpacity = Math.min(1, Math.max(0, dragX) / SWIPE_THRESHOLD);

  const cardTransform = animating
    ? `translate3d(${dragX}px, 0, 0) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`
    : `translate3d(${dragX}px, 0, 0) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-obsidian"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 180ms ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Flash recommendation"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-safe right-4 z-10 w-11 h-11 rounded-full glass-panel text-obsidian-muted flex items-center justify-center active:opacity-80 touch-manipulation mt-4"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="Close Flash"
      >
        ✕
      </button>

      <div className="flex-1 flex flex-col items-center justify-center relative px-2 flash-perspective">
        {incoming && (
          <div
            className="absolute mx-6 w-[calc(100%-3rem)] max-w-md rounded-3xl glass-panel p-6 opacity-30"
            style={{
              transform: dragX < 0 ? 'translate3d(120%, 0, -40px)' : 'translate3d(-120%, 0, -40px)',
              transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        )}

        {card && (
          <div
            className="relative mx-6 w-[calc(100%-3rem)] max-w-md"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-obsidian-muted pointer-events-none z-10"
              style={{ opacity: leftOpacity }}
            >
              ✕
            </div>
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-emerald-400 pointer-events-none z-10"
              style={{ opacity: rightOpacity }}
            >
              ♥
            </div>

            <div
              className="rounded-3xl glass-panel p-6 touch-manipulation flash-card-3d"
              style={{
                transform: cardTransform,
                transition: animating
                  ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
              }}
            >
              <p className="type-meta text-emerald-400/90 mb-3">⚡ Flash</p>
              <h2 className="type-display text-[26px] leading-tight mb-2">{card.name}</h2>
              <p className="text-sm text-obsidian-muted italic leading-snug mb-3">
                {card.contextReason}
              </p>
              <span className="inline-block text-[11px] font-semibold text-obsidian-muted glass-panel px-3 py-1 rounded-full mb-3">
                {card.distanceLabel}
              </span>
              <p className="text-[13px] text-obsidian-soft leading-snug mb-4">
                {card.vibeOrDescription}
              </p>

              <div className="border-t border-glass pt-4 space-y-3">
                <button
                  type="button"
                  onClick={handlePrimary}
                  className="w-full h-[52px] bg-emerald-500 text-obsidian font-bold rounded-xl active:scale-[0.97] touch-manipulation flash-fab-glow"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {card.primaryActionLabel}
                </button>

                <button
                  type="button"
                  onClick={() => completeSwipe('left')}
                  className="w-full h-11 border-glass glass-panel text-obsidian-soft font-semibold rounded-xl active:opacity-80 touch-manipulation text-sm"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Swipe for another →
                </button>

                <CoinFlip
                  venueName={card.name}
                  venueId={card.id}
                  primaryActionLabel={card.primaryActionLabel}
                  onPrimaryAction={handlePrimary}
                  onSwipeNext={() => completeSwipe('left')}
                  flipCount={coinFlips}
                  maxFlips={3}
                  onFlipComplete={() => setCoinFlips((c) => c + 1)}
                />
              </div>
            </div>
          </div>
        )}

        {!card && (
          <p className="text-obsidian-muted text-sm px-6 text-center">
            No more picks right now — check back later.
          </p>
        )}
      </div>

      <div className="flex justify-center gap-12 pb-10 safe-bottom">
        <button
          type="button"
          onClick={() => completeSwipe('left')}
          className="w-14 h-14 rounded-full glass-panel flex items-center justify-center text-xl text-obsidian-muted active:opacity-80 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Pass"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => completeSwipe('right')}
          className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-xl text-emerald-400 active:opacity-80 touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Save"
        >
          ♥
        </button>
      </div>

      {showToast && (
        <div className="absolute bottom-24 left-4 right-4 mx-auto max-w-md glass-panel text-obsidian-soft text-sm font-medium text-center py-3 px-4 rounded-xl animate-[fadeUp_0.28s_cubic-bezier(0.16,1,0.3,1)]">
          Your Flash picks just got smarter ✓
        </div>
      )}
    </div>
  );
}
