import { create } from 'zustand';
import type { PTWMapFilters } from '../services/ptw-map.service';

type PTWMapMode = 'SVG' | 'DATA' | 'IMAGE';
type SelectedMapItem = { type: 'permit' | 'equipment' | 'conflict' | 'area' | 'alert'; id: string } | null;

type PTWMapState = {
  filters: PTWMapFilters;
  mode: PTWMapMode | 'AUTO';
  selected: SelectedMapItem;
  rightPanelOpen: boolean;
  layoutManagerOpen: boolean;
  setFilters: (filters: Partial<PTWMapFilters>) => void;
  resetFilters: () => void;
  setMode: (mode: PTWMapMode | 'AUTO') => void;
  select: (item: SelectedMapItem) => void;
  setRightPanelOpen: (open: boolean) => void;
  setLayoutManagerOpen: (open: boolean) => void;
};

export const initialPTWMapFilters: PTWMapFilters = {};

export const usePTWMapStore = create<PTWMapState>((set) => ({
  filters: initialPTWMapFilters,
  mode: 'AUTO',
  selected: null,
  rightPanelOpen: true,
  layoutManagerOpen: false,
  setFilters: (filters) => set((state) => ({ filters: cleanFilters({ ...state.filters, ...filters }) })),
  resetFilters: () => set({ filters: initialPTWMapFilters, selected: null }),
  setMode: (mode) => set({ mode }),
  select: (item) => set({ selected: item, rightPanelOpen: true }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setLayoutManagerOpen: (open) => set({ layoutManagerOpen: open })
}));

function cleanFilters(filters: PTWMapFilters): PTWMapFilters {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')) as PTWMapFilters;
}
