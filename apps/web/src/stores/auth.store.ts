import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  selectedSiteId: string | null;
  setSession: (accessToken: string, tenantId: string, refreshToken?: string) => void;
  setSelectedSite: (siteId: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  tenantId: null,
  selectedSiteId: null,
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
  clearSession: () => {
    window.localStorage.removeItem('psm.accessToken');
    window.localStorage.removeItem('psm.refreshToken');
    window.localStorage.removeItem('psm.tenantId');
    window.localStorage.removeItem('psm.selectedSiteId');
    set({ accessToken: null, refreshToken: null, tenantId: null, selectedSiteId: null });
  }
}));
