// ============================================================
// MatchDay — AI User Profile Context
// 7-axis behavioral intelligence profile with localStorage persistence
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ─── TYPE DEFINITIONS ────────────────────────────────────────

export interface AIUserProfile {
  pace: 'High-Velocity Explorer' | 'Leisurely Flâneur';
  cognitiveStyle: 'The Decoder' | 'The Unwinder';
  palate: {
    favoriteFlavorProfiles: string[];
    dealBreakers: string[];
  };
  fuelSource: 'Coffee' | 'Beer' | 'Both';
  culturalTribe: 'The High-Energy Arena' | 'The Low-Light Theater';
  historyInterest: boolean;
  socialDynamic: 'Solo Nomad' | 'The Collective' | 'The Romantic';
  onboardingComplete: boolean;
}

export type ProfilePatch = Partial<Omit<AIUserProfile, 'palate'>> & {
  palate?: Partial<AIUserProfile['palate']>;
};

interface AIProfileContextValue {
  profile: AIUserProfile;
  updateProfile: (patch: ProfilePatch) => void;
  resetProfile: () => void;
}

// ─── CONSTANTS ───────────────────────────────────────────────

const STORAGE_KEY = 'mds_ai_profile';

const DEFAULT_PROFILE: AIUserProfile = {
  pace: 'High-Velocity Explorer',
  cognitiveStyle: 'The Decoder',
  palate: {
    favoriteFlavorProfiles: [],
    dealBreakers: [],
  },
  fuelSource: 'Coffee',
  culturalTribe: 'The High-Energy Arena',
  historyInterest: false,
  socialDynamic: 'Solo Nomad',
  onboardingComplete: false,
};

// ─── SCHEMA-SAFE HYDRATION ───────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

function hydrateProfile(raw: unknown): AIUserProfile {
  if (!isObject(raw)) {
    return { ...DEFAULT_PROFILE, palate: { ...DEFAULT_PROFILE.palate } };
  }

  const p: AIUserProfile = {
    ...DEFAULT_PROFILE,
    palate: { ...DEFAULT_PROFILE.palate },
  };

  if (raw.pace === 'High-Velocity Explorer' || raw.pace === 'Leisurely Flâneur') {
    p.pace = raw.pace;
  }
  if (raw.cognitiveStyle === 'The Decoder' || raw.cognitiveStyle === 'The Unwinder') {
    p.cognitiveStyle = raw.cognitiveStyle;
  }
  if (isObject(raw.palate)) {
    if (isStringArray(raw.palate.favoriteFlavorProfiles)) {
      p.palate.favoriteFlavorProfiles = raw.palate.favoriteFlavorProfiles;
    }
    if (isStringArray(raw.palate.dealBreakers)) {
      p.palate.dealBreakers = raw.palate.dealBreakers;
    }
  }
  if (raw.fuelSource === 'Coffee' || raw.fuelSource === 'Beer' || raw.fuelSource === 'Both') {
    p.fuelSource = raw.fuelSource;
  }
  if (
    raw.culturalTribe === 'The High-Energy Arena' ||
    raw.culturalTribe === 'The Low-Light Theater'
  ) {
    p.culturalTribe = raw.culturalTribe;
  }
  if (typeof raw.historyInterest === 'boolean') {
    p.historyInterest = raw.historyInterest;
  }
  if (
    raw.socialDynamic === 'Solo Nomad' ||
    raw.socialDynamic === 'The Collective' ||
    raw.socialDynamic === 'The Romantic'
  ) {
    p.socialDynamic = raw.socialDynamic;
  }
  if (typeof raw.onboardingComplete === 'boolean') {
    p.onboardingComplete = raw.onboardingComplete;
  }

  return p;
}

function readProfile(): AIUserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE, palate: { ...DEFAULT_PROFILE.palate } };
    return hydrateProfile(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_PROFILE, palate: { ...DEFAULT_PROFILE.palate } };
  }
}

function persistProfile(profile: AIUserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or storage full — silently ignore */
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────

const AIProfileContext = createContext<AIProfileContextValue | null>(null);

// ─── PROVIDER ────────────────────────────────────────────────

export function AIProfileProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [profile, setProfileState] = useState<AIUserProfile>(readProfile);

  const updateProfile = useCallback((patch: ProfilePatch): void => {
    setProfileState((prev) => {
      const next: AIUserProfile = {
        ...prev,
        ...patch,
        palate: patch.palate
          ? { ...prev.palate, ...patch.palate }
          : prev.palate,
      };
      persistProfile(next);
      return next;
    });
  }, []);

  const resetProfile = useCallback((): void => {
    const fresh: AIUserProfile = {
      ...DEFAULT_PROFILE,
      palate: { ...DEFAULT_PROFILE.palate },
    };
    persistProfile(fresh);
    setProfileState(fresh);
  }, []);

  return (
    <AIProfileContext.Provider value={{ profile, updateProfile, resetProfile }}>
      {children}
    </AIProfileContext.Provider>
  );
}

// ─── HOOK ────────────────────────────────────────────────────

export function useAIProfile(): AIProfileContextValue {
  const ctx = useContext(AIProfileContext);
  if (!ctx) {
    throw new Error('useAIProfile must be used within AIProfileProvider');
  }
  return ctx;
}
