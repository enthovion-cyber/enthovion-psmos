'use client';

import { ReactNode } from 'react';
import { useCan } from '../hooks/useCan';

export function Can({ permission, children, fallback = null }: { permission: string | string[]; children: ReactNode; fallback?: ReactNode }) {
  const { allowed, isLoading } = useCan(permission);
  if (isLoading) return null;
  return allowed ? <>{children}</> : <>{fallback}</>;
}
