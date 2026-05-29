import { createContext, useContext, type ReactNode } from 'react';

import { useAgeTier } from '../hooks/useAgeTier';
import type { AgeTier } from '../types';

interface AgeTierContextValue {
  ageTier: AgeTier | null;
  setAgeTier: (tier: AgeTier) => void;
  hasSelected: boolean;
}

const AgeTierContext = createContext<AgeTierContextValue | null>(null);

export function AgeTierProvider({ children }: { children: ReactNode }) {
  const value = useAgeTier();
  return (
    <AgeTierContext.Provider value={value}>
      {children}
    </AgeTierContext.Provider>
  );
}

export function useAgeTierContext(): AgeTierContextValue {
  const ctx = useContext(AgeTierContext);
  if (!ctx) {
    throw new Error('useAgeTierContext must be used within AgeTierProvider');
  }
  return ctx;
}
