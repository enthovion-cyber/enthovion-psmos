'use client';

import { createContext, ReactNode, useContext } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { useTenantContext } from './useTenantContext';
import type { TenantContext } from '../types/tenant-context.types';

const TenantContextState = createContext<UseQueryResult<TenantContext> | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const context = useTenantContext();
  return <TenantContextState.Provider value={context}>{children}</TenantContextState.Provider>;
}

export function useTenantProviderContext() {
  const value = useContext(TenantContextState);
  if (!value) throw new Error('useTenantProviderContext must be used inside TenantProvider');
  return value;
}
