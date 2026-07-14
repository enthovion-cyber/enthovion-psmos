'use client';

import { useQuery } from '@tanstack/react-query';
import { sidebarProfileService } from '../services/sidebar-profile.service';

export function useSidebarProfile() {
  return useQuery({ queryKey: ['app-shell', 'sidebar-profile'], queryFn: sidebarProfileService.profile, staleTime: 60_000 });
}
