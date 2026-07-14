import { useQuery } from '@tanstack/react-query';
import { pssrTestingCommissioningService } from '../services/pssr-testing-commissioning.service';

export function usePSSRTestingCommissioning(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'testing-commissioning'], queryFn: () => pssrTestingCommissioningService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
