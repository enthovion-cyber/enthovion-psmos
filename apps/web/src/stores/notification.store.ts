import { create } from 'zustand';

type NotificationState = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen })
}));
