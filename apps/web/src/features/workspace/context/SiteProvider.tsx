'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useSiteContext } from './useSiteContext';

type SiteContextValue = ReturnType<typeof useSiteContext>;

const SiteContextState = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const context = useSiteContext();
  return <SiteContextState.Provider value={context}>{children}</SiteContextState.Provider>;
}

export function useSiteProviderContext() {
  const value = useContext(SiteContextState);
  if (!value) throw new Error('useSiteProviderContext must be used inside SiteProvider');
  return value;
}
