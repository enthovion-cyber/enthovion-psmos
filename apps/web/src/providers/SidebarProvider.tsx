'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const value = useMemo(() => ({
    collapsed,
    toggleCollapsed: () => setCollapsed((current) => !current)
  }), [collapsed]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used inside SidebarProvider');
  return context;
}
