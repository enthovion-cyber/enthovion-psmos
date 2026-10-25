import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  selectedSiteId: string | null;
  selectedUnitId: string | null;
  setSession: (accessToken: string, tenantId: string, refreshToken?: string) => void;
  setSelectedSite: (siteId: string | null) => void;
  setSelectedUnit: (unitId: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  tenantId: null,
  selectedSiteId: null,
  selectedUnitId: null,
  setSession: (accessToken, tenantId, refreshToken) => {
    window.localStorage.setItem('psm.accessToken', accessToken);
    window.localStorage.setItem('psm.tenantId', tenantId);
    if (refreshToken) window.localStorage.setItem('psm.refreshToken', refreshToken);
    set({ accessToken, refreshToken: refreshToken ?? null, tenantId });
  },
  setSelectedSite: (siteId) => {
    if (siteId) window.localStorage.setItem('psm.selectedSiteId', siteId);
    else window.localStorage.removeItem('psm.selectedSiteId');
    set({ selectedSiteId: siteId });
  },
  setSelectedUnit: (unitId) => {
    if (unitId) window.localStorage.setItem('psm.selectedUnitId', unitId);
    else window.localStorage.removeItem('psm.selectedUnitId');
    set({ selectedUnitId: unitId });
  },
  clearSession: () => {
    window.localStorage.removeItem('psm.accessToken');
    window.localStorage.removeItem('psm.refreshToken');
    window.localStorage.removeItem('psm.tenantId');
    window.localStorage.removeItem('psm.selectedSiteId');
    window.localStorage.removeItem('psm.selectedUnitId');
    set({ accessToken: null, refreshToken: null, tenantId: null, selectedSiteId: null, selectedUnitId: null });
  }
}));
