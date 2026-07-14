'use client';

import { useQuery } from '@tanstack/react-query';
import { mocTemporaryEmergencyService } from '../services/moc-temporary-emergency.service';

export function useMOCTemporaryEmergency(id: string) {
  const temporary = useQuery({ queryKey: ['moc', id, 'temporary-control'], queryFn: () => mocTemporaryEmergencyService.temporary(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  const emergency = useQuery({ queryKey: ['moc', id, 'emergency-control'], queryFn: () => mocTemporaryEmergencyService.emergency(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  return { temporary, emergency };
}
