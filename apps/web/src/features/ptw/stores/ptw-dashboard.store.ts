import { create } from 'zustand';
import type { PTWRegisterFilters } from '../services/ptw-dashboard.service';

type PTWDashboardState = {
  selectedPermitId: string | null;
  filters: PTWRegisterFilters;
  setSelectedPermitId: (id: string | null) => void;
  setFilters: (filters: Partial<PTWRegisterFilters>) => void;
  applyKpiFilter: (filter: string) => void;
  resetFilters: () => void;
};

const initialFilters: PTWRegisterFilters = { page: '1', limit: '25', sort: 'planned_end_at:asc' };

export const usePTWDashboardStore = create<PTWDashboardState>((set) => ({
  selectedPermitId: null,
  filters: initialFilters,
  setSelectedPermitId: (id) => set({ selectedPermitId: id }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters, page: filters.page ?? '1' } })),
  applyKpiFilter: (filter) => {
    const params = Object.fromEntries(new URLSearchParams(filter).entries());
    set({ filters: { ...initialFilters, ...params }, selectedPermitId: null });
  },
  resetFilters: () => set({ filters: initialFilters, selectedPermitId: null })
}));
