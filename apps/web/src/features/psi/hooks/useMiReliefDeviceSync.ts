import { useQuery } from '@tanstack/react-query';
import { reliefMiSyncService } from '../services/relief-mi-sync.service';

export function useMiReliefDeviceSync(reliefBasisId?: string | undefined) {
  return useQuery({ queryKey: ['psi', 'relief-mi-sync', reliefBasisId], queryFn: () => reliefMiSyncService.diff(reliefBasisId as string), enabled: Boolean(reliefBasisId) });
}
