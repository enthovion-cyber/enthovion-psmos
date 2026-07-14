import { api } from '@/services/api';
import type { SidebarProfileResponse } from '../types/sidebar-profile.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const sidebarProfileService = {
  profile: () => api.get('/auth/me/sidebar-profile').then(unwrap<SidebarProfileResponse>)
};
