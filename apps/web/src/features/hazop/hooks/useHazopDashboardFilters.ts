'use client';

import { useMemo, useState } from 'react';
import type { HazopDashboardFilters } from '../types/hazop-dashboard.types';

export const defaultHazopDashboardFilters: HazopDashboardFilters = {
  search: '',
  siteId: '',
  unitId: '',
  areaId: '',
  studyType: '',
  status: '',
  riskPriority: '',
  leaderId: '',
  overdue: false,
  lopaRequired: false,
  pendingSignoff: false,
  revalidationDue: false,
  dateFrom: '',
  dateTo: ''
};

export function useHazopDashboardFilters() {
  const [filters, setFilters] = useState<HazopDashboardFilters>(defaultHazopDashboardFilters);
  const activeCount = useMemo(
    () => Object.entries(filters).filter(([, value]) => value !== '' && value !== false).length,
    [filters]
  );
  const setFilter = <K extends keyof HazopDashboardFilters>(key: K, value: HazopDashboardFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const reset = () => setFilters(defaultHazopDashboardFilters);
  return { filters, setFilter, setFilters, reset, activeCount };
}
