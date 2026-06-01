// ============================================================
// MatchDay — Onboarding Wizard
// 7-step AI profile builder — pure CSS transitions, no framer-motion
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useAIProfile } from '../../context/AIUserContext';
import type { ProfilePatch, AIUserProfile } from '../../context/AIUserContext';

// ─── CONSTANTS ───────────────────────────────────────────────

const TOTAL_STEPS = 7;

const FLAVOR_OPTIONS: string[] = [
  'Spicy', 'Umami', 'Sweet', 'Savory', 'Smoky', 'Fresh', 'Rich', 'Sour',
];

const DEAL_BREAKER_OPTIONS: string[] = [
  'Very Spicy', 'Seafood', 'Dairy', 'Gluten', 'Raw Fish', 'Offal',
];

// ─── PROP TYPES ──────────────────────────────────────────────

export interface OnboardingWizardProps {
  onComplete: () => void;
}

// ─── SHARED: OPTION CARD ─────────────────────────────────────

interface OptionCardProps {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ label, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-2xl px-5 py-4',
        'transition-all duration-150 touch-manipulation min-h-[68px]',
        selected
          ? 'ring-2 ring-emerald-500 bg-emerald-500/5'
          : 'glass-panel',
      ].join(' ')}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <p className={`font-bold text-base ${selected ? 'text-emerald-400' : 'text-zinc-100'}`}>
        {label}
      </p>
      <p className="text-sm text-zinc-500 mt-0.5 leading-snug">{description}</p>
    </button>
  );
}

// ─── SHARED: CHIP BUTTON ─────────────────────────────────────

interface ChipButtonProps {
  label: string;
  selected: boolean;
  accent: 'emerald' | 'amber';
  onClick: () => void;
}

function ChipButton({ label, selected, accent, onClick }: ChipButtonProps) {
  const activeClass =
    accent === 'emerald'
      ? 'ring-2 ring-emerald-500 bg-emerald-500/10 text-emerald-400'
      : 'ring-2 ring-amber-500 bg-amber-500/10 text-amber-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2.5 rounded-full text-sm font-semibold',
        'transition-all duration-150 touch-manipulation min-h-[44px]',
        selected ? activeClass : 'glass-panel text-zinc-400',
      ].join(' ')}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {label}
    </button>
  );
}

// ─── SHARED: STEP HEADER ─────────────────────────────────────

interface StepHeaderProps {
  step: number;
  title: string;
  subtitle: string;
}

function StepHeader({ step, title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-8">
      <p className="type-meta text-emerald-400/90 mb-3">
        Step {step} of {TOTAL_STEPS}
      </p>
      <h2 className="type-display text-[26px] leading-tight">{title}</h2>
      <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{subtitle}</p>
    </div>
  );
}

// ─── STEP 1: PACE ────────────────────────────────────────────

interface PaceStepProps {
  selected: AIUserProfile['pace'] | null;
  onSelect: (v: AIUserProfile['pace']) => void;
}

function PaceStep({ selected, onSelect }: PaceStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={1}
        title="How do you move through a city?"
        subtitle="We use this to set the pace of every recommendation."
      />
      <div className="space-y-3">
        <OptionCard
          label="High-Velocity Explorer"
          description="Pack it in — maximum experiences, minimum dead time"
          selected={selected === 'High-Velocity Explorer'}
          onClick={() => onSelect('High-Velocity Explorer')}
        />
        <OptionCard
          label="Leisurely Flâneur"
          description="One great place, stayed too long — that's the goal"
          selected={selected === 'Leisurely Flâneur'}
          onClick={() => onSelect('Leisurely Flâneur')}
        />
      </div>
    </div>
  );
}

// ─── STEP 2: COGNITIVE STYLE ──────────────────────────────────

interface CognitiveStyleStepProps {
  selected: AIUserProfile['cognitiveStyle'] | null;
  onSelect: (v: AIUserProfile['cognitiveStyle']) => void;
}

function CognitiveStyleStep({ selected, onSelect }: CognitiveStyleStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={2}
        title="What do you want from a recommendation?"
        subtitle="Context and story, or just tell me where to go."
      />
      <div className="space-y-3">
        <OptionCard
          label="The Decoder"
          description="Tell me the history, the story, why this place matters"
          selected={selected === 'The Decoder'}
          onClick={() => onSelect('The Decoder')}
        />
        <OptionCard
          label="The Unwinder"
          description="Just tell me where to go — I'll figure out the rest"
          selected={selected === 'The Unwinder'}
          onClick={() => onSelect('The Unwinder')}
        />
      </div>
    </div>
  );
}

// ─── STEP 3: PALATE ───────────────────────────────────────────

interface PalateStepProps {
  selectedFlavors: string[];
  selectedDealBreakers: string[];
  onToggleFlavor: (f: string) => void;
  onToggleDealBreaker: (d: string) => void;
  onConfirm: () => void;
}

function PalateStep({
  selectedFlavors,
  selectedDealBreakers,
  onToggleFlavor,
  onToggleDealBreaker,
  onConfirm,
}: PalateStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={3}
        title="What flavors define you?"
        subtitle="Select what calls to you — and what kills the meal."
      />
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
          I crave
        </p>
        <div className="flex flex-wrap gap-2">
          {FLAVOR_OPTIONS.map((f) => (
            <ChipButton
              key={f}
              label={f}
              selected={selectedFlavors.includes(f)}
              accent="emerald"
              onClick={() => onToggleFlavor(f)}
            />
          ))}
        </div>
      </div>
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
          Deal breakers
        </p>
        <div className="flex flex-wrap gap-2">
          {DEAL_BREAKER_OPTIONS.map((d) => (
            <ChipButton
              key={d}
              label={d}
              selected={selectedDealBreakers.includes(d)}
              accent="amber"
              onClick={() => onToggleDealBreaker(d)}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className="w-full h-[52px] bg-emerald-500 text-zinc-950 font-bold rounded-xl touch-manipulation active:scale-[0.97] transition-transform text-base"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        Continue →
      </button>
    </div>
  );
}

// ─── STEP 4: FUEL SOURCE ─────────────────────────────────────

interface FuelSourceStepProps {
  selected: AIUserProfile['fuelSource'] | null;
  onSelect: (v: AIUserProfile['fuelSource']) => void;
}

function FuelSourceStep({ selected, onSelect }: FuelSourceStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={4}
        title="What keeps you going?"
        subtitle="Shapes your venue filter for mornings versus evenings."
      />
      <div className="space-y-3">
        <OptionCard
          label="Coffee"
          description="Cafés, third-wave roasters, morning spots"
          selected={selected === 'Coffee'}
          onClick={() => onSelect('Coffee')}
        />
        <OptionCard
          label="Beer"
          description="Taprooms, craft bars, and the late-afternoon pour"
          selected={selected === 'Beer'}
          onClick={() => onSelect('Beer')}
        />
        <OptionCard
          label="Both"
          description="Flexible — mornings and evenings both count"
          selected={selected === 'Both'}
          onClick={() => onSelect('Both')}
        />
      </div>
    </div>
  );
}

// ─── STEP 5: CULTURAL TRIBE ───────────────────────────────────

interface CulturalTribeStepProps {
  selected: AIUserProfile['culturalTribe'] | null;
  onSelect: (v: AIUserProfile['culturalTribe']) => void;
}

function CulturalTribeStep({ selected, onSelect }: CulturalTribeStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={5}
        title="Your energy setting"
        subtitle="How a venue should feel when you walk in."
      />
      <div className="space-y-3">
        <OptionCard
          label="The High-Energy Arena"
          description="Crowd noise, big screens, the pulse of the game"
          selected={selected === 'The High-Energy Arena'}
          onClick={() => onSelect('The High-Energy Arena')}
        />
        <OptionCard
          label="The Low-Light Theater"
          description="Quiet enough to talk, dark enough to linger"
          selected={selected === 'The Low-Light Theater'}
          onClick={() => onSelect('The Low-Light Theater')}
        />
      </div>
    </div>
  );
}

// ─── STEP 6: HISTORY INTEREST ─────────────────────────────────

interface HistoryInterestStepProps {
  selected: boolean | null;
  onSelect: (v: boolean) => void;
}

function HistoryInterestStep({ selected, onSelect }: HistoryInterestStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={6}
        title="Does local history matter to you?"
        subtitle="We'll fire ambient pings when you walk past significant sites."
      />
      <div className="space-y-3">
        <OptionCard
          label="Yes — show me the story"
          description="Heritage badges and historical context surface automatically"
          selected={selected === true}
          onClick={() => onSelect(true)}
        />
        <OptionCard
          label="Skip it"
          description="Pure discovery mode — no history overlays"
          selected={selected === false}
          onClick={() => onSelect(false)}
        />
      </div>
    </div>
  );
}

// ─── STEP 7: SOCIAL DYNAMIC ───────────────────────────────────

interface SocialDynamicStepProps {
  selected: AIUserProfile['socialDynamic'] | null;
  onSelect: (v: AIUserProfile['socialDynamic']) => void;
}

function SocialDynamicStep({ selected, onSelect }: SocialDynamicStepProps) {
  return (
    <div className="w-full">
      <StepHeader
        step={7}
        title="Who are you with today?"
        subtitle="Affects venue size, table setup, and vibe calibration."
      />
      <div className="space-y-3">
        <OptionCard
          label="Solo Nomad"
          description="Table for one — full freedom, no compromises"
          selected={selected === 'Solo Nomad'}
          onClick={() => onSelect('Solo Nomad')}
        />
        <OptionCard
          label="The Collective"
          description="Group energy — capacity, shared plates, loud spaces"
          selected={selected === 'The Collective'}
          onClick={() => onSelect('The Collective')}
        />
        <OptionCard
          label="The Romantic"
          description="Two people, atmosphere, unhurried evening"
          selected={selected === 'The Romantic'}
          onClick={() => onSelect('The Romantic')}
        />
      </div>
    </div>
  );
}

// ─── CALIBRATION SCREEN ───────────────────────────────────────

function CalibrationScreen() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setFadeIn(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-zinc-950"
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-3 h-3 rounded-full bg-emerald-500 animate-pulse"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <p className="type-display text-xl text-zinc-50">AI Calibrating Your Feed...</p>
      <p className="text-sm text-zinc-500 mt-3 max-w-[220px] text-center leading-relaxed">
        Building your intelligence profile
      </p>
    </div>
  );
}

// ─── MAIN WIZARD ─────────────────────────────────────────────

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { updateProfile } = useAIProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  // Per-axis local selections — committed to context on advance
  const [pace, setPace] = useState<AIUserProfile['pace'] | null>(null);
  const [cognitiveStyle, setCognitiveStyle] = useState<AIUserProfile['cognitiveStyle'] | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>([]);
  const [fuelSource, setFuelSource] = useState<AIUserProfile['fuelSource'] | null>(null);
  const [culturalTribe, setCulturalTribe] = useState<AIUserProfile['culturalTribe'] | null>(null);
  const [historyInterest, setHistoryInterest] = useState<boolean | null>(null);
  const [socialDynamic, setSocialDynamic] = useState<AIUserProfile['socialDynamic'] | null>(null);

  // Mount entrance
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const advance = useCallback(
    (patch: ProfilePatch) => {
      if (!visible) return; // block double-tap during transition
      updateProfile(patch);
      setVisible(false);

      window.setTimeout(() => {
        const next = stepIndex + 1;
        if (next >= TOTAL_STEPS) {
          setCalibrating(true);
          window.setTimeout(() => {
            updateProfile({ onboardingComplete: true });
            onComplete();
          }, 2000);
        } else {
          setStepIndex(next);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setVisible(true)),
          );
        }
      }, 180);
    },
    [visible, stepIndex, updateProfile, onComplete],
  );

  const toggleFlavor = useCallback((f: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }, []);

  const toggleDealBreaker = useCallback((d: string) => {
    setSelectedDealBreakers((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }, []);

  if (calibrating) return <CalibrationScreen />;

  const progress = (stepIndex / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-zinc-950">
      {/* ── Progress bar ──────────────────────────────────────── */}
      <div className="flex-shrink-0 h-[3px] bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Step content ─────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain scrollbar-none flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(16px)',
          transition: visible
            ? 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'opacity 160ms ease-in, transform 160ms ease-in',
        }}
      >
        {stepIndex === 0 && (
          <PaceStep
            selected={pace}
            onSelect={(v) => {
              setPace(v);
              advance({ pace: v });
            }}
          />
        )}
        {stepIndex === 1 && (
          <CognitiveStyleStep
            selected={cognitiveStyle}
            onSelect={(v) => {
              setCognitiveStyle(v);
              advance({ cognitiveStyle: v });
            }}
          />
        )}
        {stepIndex === 2 && (
          <PalateStep
            selectedFlavors={selectedFlavors}
            selectedDealBreakers={selectedDealBreakers}
            onToggleFlavor={toggleFlavor}
            onToggleDealBreaker={toggleDealBreaker}
            onConfirm={() =>
              advance({
                palate: {
                  favoriteFlavorProfiles: selectedFlavors,
                  dealBreakers: selectedDealBreakers,
                },
              })
            }
          />
        )}
        {stepIndex === 3 && (
          <FuelSourceStep
            selected={fuelSource}
            onSelect={(v) => {
              setFuelSource(v);
              advance({ fuelSource: v });
            }}
          />
        )}
        {stepIndex === 4 && (
          <CulturalTribeStep
            selected={culturalTribe}
            onSelect={(v) => {
              setCulturalTribe(v);
              advance({ culturalTribe: v });
            }}
          />
        )}
        {stepIndex === 5 && (
          <HistoryInterestStep
            selected={historyInterest}
            onSelect={(v) => {
              setHistoryInterest(v);
              advance({ historyInterest: v });
            }}
          />
        )}
        {stepIndex === 6 && (
          <SocialDynamicStep
            selected={socialDynamic}
            onSelect={(v) => {
              setSocialDynamic(v);
              advance({ socialDynamic: v });
            }}
          />
        )}
      </div>

      {/* ── Step counter ─────────────────────────────────────── */}
      <div className="flex-shrink-0 pb-8 text-center">
        <p className="type-meta">
          {stepIndex + 1} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
