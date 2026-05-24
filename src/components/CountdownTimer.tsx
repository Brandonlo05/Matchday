// ============================================================
// CountdownTimer.tsx
// Animated digit-flip countdown. Transitions to a breathing
// LIVE state with period tracker when a match is in progress.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import type { CountdownState } from '../types';

interface Props {
  countdown: CountdownState;
  size?: 'sm' | 'md' | 'lg';
  showDays?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// ─── Digit flip unit ─────────────────────────────────────────

function FlipUnit({
  value, label, urgent, size,
}: {
  value: number;
  label: string;
  urgent: boolean;
  size: 'sm' | 'md' | 'lg';
}) {
  const [displayed, setDisplayed] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlipping(true);
      const t = setTimeout(() => {
        setDisplayed(value);
        setFlipping(false);
        prevRef.current = value;
      }, 120);
      return () => clearTimeout(t);
    }
  }, [value]);

  const digitSizeClass =
    size === 'lg' ? 'text-4xl' :
    size === 'md' ? 'text-2xl' :
    'text-xl';

  const labelSizeClass = size === 'lg' ? 'text-[11px]' : 'text-[9px]';

  const digitColor = urgent ? 'text-amber-400' : 'text-zinc-100';
  const labelColor = urgent ? 'text-amber-600' : 'text-zinc-600';
  const bgColor = urgent ? 'bg-amber-500/8' : 'bg-zinc-800/60';
  const borderColor = urgent ? 'border-amber-500/20' : 'border-zinc-700/40';

  return (
    <div className="flex flex-col items-center">
      <div
        className={[
          'rounded-xl border px-3 py-1.5 min-w-[3rem] flex items-center justify-center',
          bgColor, borderColor,
        ].join(' ')}
        style={{
          transform: flipping ? 'rotateX(-15deg) scale(0.95)' : 'rotateX(0deg) scale(1)',
          transition: 'transform 0.12s ease-in-out',
          transformStyle: 'preserve-3d',
        }}
      >
        <span
          className={[
            'font-black tabular-nums leading-none transition-opacity duration-100',
            digitSizeClass, digitColor,
            flipping ? 'opacity-30' : 'opacity-100',
          ].join(' ')}
        >
          {pad(displayed)}
        </span>
      </div>
      <span className={['font-bold tracking-widest mt-1 uppercase', labelSizeClass, labelColor].join(' ')}>
        {label}
      </span>
    </div>
  );
}

// ─── Separator ───────────────────────────────────────────────

function Sep({ urgent }: { urgent: boolean }) {
  return (
    <span
      className={[
        'text-2xl font-black self-start mt-1.5 select-none',
        urgent ? 'text-amber-500' : 'text-zinc-700',
      ].join(' ')}
    >
      :
    </span>
  );
}

// ─── LIVE period display ─────────────────────────────────────

function LivePeriodDisplay({ countdown }: { countdown: CountdownState }) {
  const [pulse, setPulse] = useState(true);

  // Alternate between full and dim every 800ms for a "breathing" effect
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(t);
  }, []);

  function periodLabel(): string {
    if (countdown.period === 'first_half')  return `1ST HALF`;
    if (countdown.period === 'halftime')    return 'HALF TIME';
    if (countdown.period === 'second_half') return '2ND HALF';
    if (countdown.period === 'extra_time')  return 'EXTRA TIME';
    if (countdown.period === 'penalties')   return 'PENALTIES';
    return 'IN PROGRESS';
  }

  const minute = countdown.matchMinute ?? 0;
  const showMinute = countdown.period !== 'halftime' && countdown.period !== 'penalties';

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {/* Breathing LIVE badge */}
      <div
        className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-5 py-2"
        style={{
          opacity: pulse ? 1 : 0.65,
          transform: pulse ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
        }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-emerald-400 text-sm font-black tracking-widest">LIVE</span>
      </div>

      {/* Period + minute */}
      <div className="flex items-baseline gap-2">
        <span className="text-zinc-300 text-xs font-bold tracking-wider">{periodLabel()}</span>
        {showMinute && (
          <>
            <span className="text-zinc-600">·</span>
            <span className="text-emerald-400 text-lg font-black tabular-nums leading-none">
              {minute}'
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Completed state ─────────────────────────────────────────

function CompletedDisplay() {
  return (
    <div className="flex items-center gap-2 py-3">
      <span className="text-zinc-500 text-sm">Match Ended</span>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────

export function CountdownTimer({ countdown, size = 'md', showDays = true }: Props) {
  if (countdown.isCompleted) return <CompletedDisplay />;
  if (countdown.isLive) return <LivePeriodDisplay countdown={countdown} />;

  const urgent = countdown.isPreKickoff;

  return (
    <div className="flex items-center gap-2">
      {showDays && countdown.days > 0 && (
        <>
          <FlipUnit value={countdown.days} label="DAYS" urgent={urgent} size={size} />
          <Sep urgent={urgent} />
        </>
      )}
      <FlipUnit value={countdown.hours} label="HRS" urgent={urgent} size={size} />
      <Sep urgent={urgent} />
      <FlipUnit value={countdown.minutes} label="MIN" urgent={urgent} size={size} />
      <Sep urgent={urgent} />
      <FlipUnit value={countdown.seconds} label="SEC" urgent={urgent} size={size} />
    </div>
  );
}
