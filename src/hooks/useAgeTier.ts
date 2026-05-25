// ============================================================
// useAgeTier.ts
// Reads and writes the user's one-time age tier preference.
// Stored forever under `mds_age_tier` in localStorage.
// ============================================================

import { useState, useCallback } from 'react';
import type { AgeTier } from '../types';

const LS_KEY = 'mds_age_tier';

function readStored(): AgeTier | null {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === 'family' || v === 'adult' || v === 'open') return v;
    return null;
  } catch {
    return null;
  }
}

export interface UseAgeTierReturn {
  ageTier: AgeTier | null;
  setAgeTier: (tier: AgeTier) => void;
  hasSelected: boolean;
}

export function useAgeTier(): UseAgeTierReturn {
  const [ageTier, setAgeTierState] = useState<AgeTier | null>(readStored);

  const setAgeTier = useCallback((tier: AgeTier) => {
    try {
      localStorage.setItem(LS_KEY, tier);
    } catch {
      // localStorage unavailable — still update in-memory state
    }
    setAgeTierState(tier);
  }, []);

  return {
    ageTier,
    setAgeTier,
    hasSelected: ageTier !== null,
  };
}
