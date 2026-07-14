'use client';

import { useMutation } from '@tanstack/react-query';
import { securityEventsService } from '../services/security-events.service';

export function useReportSuspiciousLogin() {
  return useMutation({ mutationFn: securityEventsService.reportSuspiciousLogin });
}
