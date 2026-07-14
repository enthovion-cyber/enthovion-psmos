import { create } from 'zustand';
import type { MOCDashboardFilters } from '../services/moc-dashboard.service';

type MOCDashboardState = {
  filters: MOCDashboardFilters;
  selectedMocId: string | undefined;
  setFilter: <K extends keyof MOCDashboardFilters>(key: K, value: MOCDashboardFilters[K] | undefined) => void;
  setFilters: (filters: Partial<MOCDashboardFilters>) => void;
  resetFilters: () => void;
  setSelectedMocId: (id?: string) => void;
};

export const useMOCDashboardStore = create<MOCDashboardState>((set) => ({
  filters: { page: 1, limit: 25, sort: 'updated_at.desc' },
  selectedMocId: undefined,
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, page: key === 'page' ? Number(value ?? 1) : 1, [key]: value } })),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters, page: filters.page ?? 1 } })),
  resetFilters: () => set({ filters: { page: 1, limit: 25, sort: 'updated_at.desc' } }),
  setSelectedMocId: (selectedMocId) => set({ selectedMocId })
}));
