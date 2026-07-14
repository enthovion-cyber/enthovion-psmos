import { useMOCDashboardStore } from '../stores/moc-dashboard.store';

export function useMOCRegisterFilters() {
  const filters = useMOCDashboardStore((state) => state.filters);
  const setFilter = useMOCDashboardStore((state) => state.setFilter);
  const setFilters = useMOCDashboardStore((state) => state.setFilters);
  const resetFilters = useMOCDashboardStore((state) => state.resetFilters);
  return { filters, setFilter, setFilters, resetFilters };
}
