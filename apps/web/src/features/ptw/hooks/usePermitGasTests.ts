import { useQuery } from '@tanstack/react-query';
import { ptwGasTestService } from '../services/ptw-gas-test.service';

export function usePermitGasTests(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'gas-tests'], queryFn: () => ptwGasTestService.list(permitId) });
}

export function usePermitGasTestSummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'gas-tests', 'summary'], queryFn: () => ptwGasTestService.summary(permitId) });
}

export function useLatestGasTest(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'gas-tests', 'latest'], queryFn: () => ptwGasTestService.latest(permitId) });
}

export function useGasTestHistory(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'gas-tests', 'history'], queryFn: () => ptwGasTestService.history(permitId) });
}

export function useGasTestTrends(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'gas-tests', 'trends'], queryFn: () => ptwGasTestService.trends(permitId) });
}

export function usePermitGasThresholds(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'gas-thresholds'], queryFn: () => ptwGasTestService.thresholdsForPermit(permitId) });
}
