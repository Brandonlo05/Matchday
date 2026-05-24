// ============================================================
// TransitHacks.tsx
// Interactive transit checklist per stadium city. Fans tap to
// check off steps as they travel. Progress persists to localStorage.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { CityId } from '../types';

// ─── Data ────────────────────────────────────────────────────

interface TransitStep {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  time?: string;       // estimated time cost e.g. "~12 min"
  proTip?: string;
  warning?: boolean;
}

interface StadiumTransit {
  cityId: CityId;
  stadiumName: string;
  primaryLine: string;    // e.g. "Metro C Line"
  steps: TransitStep[];
  parkingNote: string;
  arrivalBuffer: string;  // e.g. "Arrive 90 min early"
}

const TRANSIT_DATA: Record<CityId, StadiumTransit> = {
  la: {
    cityId: 'la',
    stadiumName: 'SoFi Stadium · Inglewood',
    primaryLine: 'Metro C Line (Green)',
    arrivalBuffer: 'Arrive 90 min early',
    parkingNote: '⚠️ No parking available on-site. All-day lots sell out days ahead.',
    steps: [
      {
        id: 'la-1', emoji: '🚇', title: 'Take the Metro C Line (Green)',
        detail: 'Board at 7th St/Metro Center, Aviation/LAX, or Redondo Beach.',
        time: '20–40 min', proTip: 'Buy a TAP card in advance — machines get long queues on match days.',
      },
      {
        id: 'la-2', emoji: '🛑', title: 'Exit at Hawthorne/Lennox Station',
        detail: 'The stadium is a 10-min walk south from the Hawthorne/Lennox stop.',
        time: '~10 min walk',
      },
      {
        id: 'la-3', emoji: '🎫', title: 'Have ticket ready on Ticketmaster app',
        detail: 'Paper tickets are not accepted. Screenshot your QR code before leaving home.',
        warning: true, proTip: 'Download your ticket to Wallet (Apple/Google) so it works offline.',
      },
      {
        id: 'la-4', emoji: '🧴', title: 'Pass bag check & prohibited items screen',
        detail: 'No bags larger than 12"×6"×12". Clear bags recommended.',
        warning: true,
      },
      {
        id: 'la-5', emoji: '💧', title: 'Refill water at hydration stations inside',
        detail: 'One empty reusable bottle allowed. Fill up before kickoff.',
        proTip: 'Concession lines are brutal during kickoff — grab food & water during warm-up.',
      },
      {
        id: 'la-6', emoji: '📍', title: 'Locate your section & seat',
        detail: 'Use the SoFi Stadium app for wayfinding and concession ordering.',
        time: '~5 min',
      },
    ],
  },

  cdmx: {
    cityId: 'cdmx',
    stadiumName: 'Estadio Azteca · Coyoacán',
    primaryLine: 'Metro Línea 2 (Blue) + Tren Ligero',
    arrivalBuffer: 'Arrive 2 hrs early',
    parkingNote: '⚠️ Surrounding streets close 3 hrs before kickoff. Do not drive.',
    steps: [
      {
        id: 'cdmx-1', emoji: '🚇', title: 'Metro Línea 2 to Tasqueña (Terminal)',
        detail: 'Blue line — direction Tasqueña. This is the main hub for the Azteca.',
        time: '~30 min from Centro',
        proTip: 'Ride during off-peak if possible — Metro gets extremely packed 2 hrs before kickoff.',
      },
      {
        id: 'cdmx-2', emoji: '🚃', title: 'Transfer to Tren Ligero at Tasqueña',
        detail: 'Exit Metro, follow signs to "Tren Ligero". Board toward El Huipulco.',
        time: '~15 min',
      },
      {
        id: 'cdmx-3', emoji: '🛑', title: 'Exit at Estadio Azteca stop',
        detail: 'The stadium is directly adjacent to the Tren Ligero stop.',
        time: '2 min walk',
      },
      {
        id: 'cdmx-4', emoji: '💵', title: 'Carry cash (pesos) for street food',
        detail: 'The best pre-game tacos & elotes are outside the stadium — card not accepted.',
        proTip: 'ATM lines are long at the stadium. Withdraw the night before.',
      },
      {
        id: 'cdmx-5', emoji: '🎫', title: 'Have ID + ticket ready for inspection',
        detail: 'Mexico requires ID match to your ticket for security. Passport or INE required.',
        warning: true,
      },
      {
        id: 'cdmx-6', emoji: '🌧️', title: 'Check weather — afternoon rains are common',
        detail: 'Bring a small rain poncho June–July. Thunderstorms can delay entry.',
        proTip: 'Ponchos are sold outside for ~50 MXN but quality is poor. Bring your own.',
      },
    ],
  },

  toronto: {
    cityId: 'toronto',
    stadiumName: 'BMO Field · Exhibition Place',
    primaryLine: 'Lakeshore streetcar (509 / 511)',
    arrivalBuffer: 'Arrive 75 min early',
    parkingNote: '🅿️ Exhibition Place lots available but expensive. GO Train + walk is fastest.',
    steps: [
      {
        id: 'tor-1', emoji: '🚂', title: 'Take GO Train to Exhibition Station',
        detail: 'Lakeshore West line — Kitchener or Milton branches also work.',
        time: '~12 min from Union',
        proTip: 'Presto card is the fastest tap-on method — avoid fare machine queues.',
      },
      {
        id: 'tor-2', emoji: '🚋', title: 'Or: TTC Streetcar 509 / 511 from Union',
        detail: 'Boards on Bay St — exit at Dufferin Gate.',
        time: '~18 min',
      },
      {
        id: 'tor-3', emoji: '🚶', title: 'Walk south through Exhibition Place',
        detail: 'Follow World Cup 2026 wayfinding signs from Dufferin Gate to BMO Field.',
        time: '~8 min walk',
      },
      {
        id: 'tor-4', emoji: '🎫', title: 'Have digital ticket + Presto card ready',
        detail: 'BMO Field uses Ticketmaster Presence scanning — no screenshots, phone must be on.',
        warning: true, proTip: 'Add ticket to Apple Wallet offline before you leave home.',
      },
      {
        id: 'tor-5', emoji: '🍁', title: 'Grab a Canadian flag or scarf from vendors',
        detail: 'Unofficial merch vendors line the Exhibition Place entrance walk.',
        proTip: 'Official merchandise inside sells out fast. Buy outside before entry.',
      },
      {
        id: 'tor-6', emoji: '❄️', title: 'Layer up — evening games can be chilly',
        detail: 'Toronto evenings in June can drop to 12°C. Bring a light jacket.',
      },
    ],
  },

  ny: {
    cityId: 'ny',
    stadiumName: 'MetLife Stadium · East Rutherford NJ',
    primaryLine: 'NJ Transit Train + Stadium Shuttle',
    arrivalBuffer: 'Arrive 2 hrs early',
    parkingNote: '🅿️ Lots A–E require advance purchase. ~$50. Add 45 min to leave post-match.',
    steps: [
      {
        id: 'ny-1', emoji: '🚉', title: 'NJ Transit from Penn Station (Secaucus Junction)',
        detail: 'Take any NJ Transit Morris & Essex, Montclair-Boonton, or Main/Bergen train to Secaucus Junction.',
        time: '~12 min', proTip: 'Buy round-trip on the NJ Transit app — ticket windows have huge queues on match days.',
      },
      {
        id: 'ny-2', emoji: '🔄', title: 'Transfer at Secaucus Junction to Meadowlands Rail',
        detail: 'Follow signs to Meadowlands Rail (seasonal). Runs direct to stadium.',
        time: '~15 min',
        warning: true, proTip: 'Meadowlands Rail only runs for major events. Confirm schedule on njtransit.com.',
      },
      {
        id: 'ny-3', emoji: '🛑', title: 'Exit at Meadowlands Station → 5-min walk to gates',
        detail: 'Follow the crowd and signage to the MetLife entry gates.',
        time: '5 min walk',
      },
      {
        id: 'ny-4', emoji: '🎫', title: 'Have ticket + photo ID ready at gate',
        detail: 'MetLife uses mobile-only entry (Ticketmaster). Ensure phone is charged.',
        warning: true, proTip: 'Bring a portable charger — the stadium has limited outlets.',
      },
      {
        id: 'ny-5', emoji: '🌭', title: 'Consider pre-game food in East Rutherford',
        detail: 'The stadium concessions are expensive. Grab food at nearby American Dream Mall or local spots.',
        proTip: 'Tailgate lots open 5 hrs before kickoff. Best atmosphere of any stadium.',
      },
      {
        id: 'ny-6', emoji: '⏱️', title: 'Plan for 45–60 min exit after the match',
        detail: 'Post-game trains and shuttles back to Secaucus are mobbed. Have a plan.',
        warning: true, proTip: 'Walk to the far end of the platform for less crowded boarding.',
      },
    ],
  },
};

// ─── localStorage helper ─────────────────────────────────────

const LS_KEY = 'mds_transit_checks';

function loadChecks(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}

function saveChecks(checks: Record<string, boolean>) {
  localStorage.setItem(LS_KEY, JSON.stringify(checks));
}

// ─── Step row ────────────────────────────────────────────────

function StepRow({
  step, checked, onToggle,
}: {
  step: TransitStep;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left flex items-start gap-3 py-3 px-4 rounded-xl transition-all active:scale-[0.98] touch-manipulation select-none"
      style={{
        WebkitTapHighlightColor: 'transparent',
        backgroundColor: checked ? 'rgba(16,185,129,0.06)' : 'rgba(39,39,42,0.5)',
        border: `1px solid ${checked ? 'rgba(16,185,129,0.2)' : 'rgba(63,63,70,0.5)'}`,
      }}
    >
      {/* Checkbox circle */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all duration-200"
        style={{
          backgroundColor: checked ? 'rgb(16,185,129)' : 'transparent',
          borderColor: checked ? 'rgb(16,185,129)' : 'rgb(82,82,91)',
          transform: checked ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="rgb(9,9,11)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base leading-none">{step.emoji}</span>
          <span
            className={[
              'text-sm font-bold transition-colors duration-200',
              checked ? 'text-zinc-500 line-through' : step.warning ? 'text-amber-300' : 'text-zinc-200',
            ].join(' ')}
          >
            {step.title}
          </span>
          {step.time && !checked && (
            <span className="text-[10px] text-zinc-600 font-medium ml-auto flex-shrink-0">{step.time}</span>
          )}
        </div>
        {!checked && (
          <>
            <p className="text-xs text-zinc-500 leading-snug">{step.detail}</p>
            {step.proTip && (
              <p className="text-[11px] text-emerald-500/70 mt-1 leading-snug">
                💡 {step.proTip}
              </p>
            )}
          </>
        )}
      </div>
    </button>
  );
}

// ─── Main export ─────────────────────────────────────────────

interface Props {
  cityId: CityId;
}

export function TransitHacks({ cityId }: Props) {
  const data = TRANSIT_DATA[cityId];
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks);
  const [expanded, setExpanded] = useState(true);

  const checkedCount = data.steps.filter((s) => checks[s.id]).length;
  const totalCount = data.steps.length;
  const allDone = checkedCount === totalCount;
  const progress = totalCount > 0 ? checkedCount / totalCount : 0;

  const toggle = useCallback((id: string) => {
    setChecks((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      saveChecks(updated);
      return updated;
    });
  }, []);

  const resetCity = useCallback(() => {
    setChecks((prev) => {
      const updated = { ...prev };
      data.steps.forEach((s) => { delete updated[s.id]; });
      saveChecks(updated);
      return updated;
    });
  }, [data.steps]);

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left touch-manipulation active:bg-zinc-800 transition-colors"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="text-xl">🚇</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-200">Getting to {data.stadiumName.split('·')[0].trim()}</p>
          <p className="text-[11px] text-zinc-500">{data.primaryLine} · {data.arrivalBuffer}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-bold ${allDone ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {checkedCount}/{totalCount}
          </span>
          <span
            className="text-zinc-600 text-sm transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-800 mx-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: allDone
              ? 'linear-gradient(to right, #10b981, #34d399)'
              : 'linear-gradient(to right, #10b981, #059669)',
          }}
        />
      </div>

      {/* Steps list */}
      {expanded && (
        <div className="px-3 py-3 space-y-2">
          {/* Parking warning */}
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
            <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-amber-300/80 text-xs leading-snug">{data.parkingNote}</p>
          </div>

          {data.steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              checked={!!checks[step.id]}
              onToggle={() => toggle(step.id)}
            />
          ))}

          {/* All done state */}
          {allDone && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-emerald-400 text-sm font-bold">✅ You're ready to roll!</p>
              <p className="text-emerald-500/60 text-xs mt-0.5">Enjoy the match — see you at the stadium</p>
            </div>
          )}

          {/* Reset */}
          {checkedCount > 0 && (
            <button
              onClick={resetCity}
              className="w-full text-center text-xs text-zinc-600 py-2 active:text-zinc-400 transition-colors touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Reset checklist
            </button>
          )}
        </div>
      )}
    </div>
  );
}
