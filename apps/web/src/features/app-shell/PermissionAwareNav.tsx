'use client';

import { ReactNode } from 'react';
import { useNavigation } from '@/features/navigation/useNavigation';

export function PermissionAwareNav({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const navigation = useNavigation();
  if (navigation.isLoading) return null;
  if (navigation.isError || !navigation.data?.items?.length) return <>{fallback}</>;
  return <>{children}</>;
}
