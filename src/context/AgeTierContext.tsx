// ============================================================
// AgeTierContext.tsx
// Provides ageTier + setAgeTier to the entire component tree.
// Wrap <App /> in <AgeTierProvider> as the outermost wrapper.
// ============================================================

import { createContext, useContext } from 'react';
import { useAgeTier } from '../hooks/useAgeTier';
import type { AgeTier } from '../types';

interface AgeTierContextValue {
  ageTier: AgeTier | null;
  setAgeTier: (tier: AgeTier) => void;
  hasSelected: boolean;
}

const AgeTierContext = createContext<AgeTierContextValue>({
  ageTier: null,
  setAgeTier: () => {},
  hasSelected: false,
});

export function AgeTierProvider({ children }: { children: React.ReactNode }) {
  const value = useAgeTier();
  return (
    <AgeTierContext.Provider value={value}>
      {children}
    </AgeTierContext.Provider>
  );
}

/** Consume age tier anywhere in the tree — never null after gate clears */
export function useAgeTierContext(): AgeTierContextValue {
  return useContext(AgeTierContext);
}
