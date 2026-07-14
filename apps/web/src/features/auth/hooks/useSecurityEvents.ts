'use client';

import { useQuery } from '@tanstack/react-query';
import { securityEventsService } from '../services/security-events.service';

export function useSecurityEvents() {
  return useQuery({ queryKey: ['auth', 'security-events'], queryFn: securityEventsService.mine });
}
