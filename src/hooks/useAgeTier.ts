import { useCallback, useState } from 'react';

import type { AgeTier } from '../types';

const STORAGE_KEY = 'mds_age_tier';

function readTier(): AgeTier | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'family' || raw === 'adult' || raw === 'open') return raw;
  } catch {
    /* private mode */
  }
  return null;
}

export function useAgeTier() {
  const [ageTier, setAgeTierState] = useState<AgeTier | null>(readTier);

  const setAgeTier = useCallback((tier: AgeTier) => {
    setAgeTierState(tier);
    try {
      localStorage.setItem(STORAGE_KEY, tier);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    ageTier,
    setAgeTier,
    hasSelected: ageTier !== null,
  };
}
