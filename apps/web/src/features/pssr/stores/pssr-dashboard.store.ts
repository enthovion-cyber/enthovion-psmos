'use client';

import { create } from 'zustand';
import type { PSSRDashboardFilters } from '../services/pssr-dashboard.service';

type PSSRDashboardStore = {
  filters: PSSRDashboardFilters;
  visibleColumns: string[];
  setFilter: (key: string, value?: string | number) => void;
  setFilters: (filters: PSSRDashboardFilters) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSort: (sort: string) => void;
  toggleColumn: (column: string) => void;
};

const defaultColumns = ['pssr', 'type', 'status', 'readiness', 'location', 'equipment', 'moc', 'startup', 'coordinator', 'blockers', 'authorization', 'updated'];

export const usePSSRDashboardStore = create<PSSRDashboardStore>((set) => ({
  filters: { page: 1, limit: 25, sort: '-updated_at' },
  visibleColumns: defaultColumns,
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, page: 1, [key]: value || undefined } })),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } })),
  resetFilters: () => set({ filters: { page: 1, limit: 25, sort: '-updated_at' } }),
  setPage: (page) => set((state) => ({ filters: { ...state.filters, page } })),
  setSort: (sort) => set((state) => ({ filters: { ...state.filters, sort, page: 1 } })),
  toggleColumn: (column) => set((state) => ({ visibleColumns: state.visibleColumns.includes(column) ? state.visibleColumns.filter((item) => item !== column) : [...state.visibleColumns, column] }))
}));
