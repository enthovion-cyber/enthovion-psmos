'use client';

import { useMemo } from 'react';
import { useMyPermissions } from './useMyPermissions';

export function useCan(permission: string | string[]) {
  const permissionsQuery = useMyPermissions();
  const permissions = permissionsQuery.data ?? [];
  const allowed = useMemo(() => {
    const required = Array.isArray(permission) ? permission : [permission];
    return required.some((item) => permissions.includes(item));
  }, [permission, permissions]);
  return { ...permissionsQuery, allowed };
}
