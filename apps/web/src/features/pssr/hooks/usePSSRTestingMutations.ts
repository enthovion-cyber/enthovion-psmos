import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrTestingCommissioningService } from '../services/pssr-testing-commissioning.service';

export function usePSSRTestingMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'testing-commissioning'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'punch-list'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'history'] });
  };
  return {
    generate: useMutation({ mutationFn: () => pssrTestingCommissioningService.generate(pssrId), onSuccess: invalidate }),
    syncFromMoc: useMutation({ mutationFn: () => pssrTestingCommissioningService.syncFromMoc(pssrId), onSuccess: invalidate }),
    syncFromEngineering: useMutation({ mutationFn: () => pssrTestingCommissioningService.syncFromEngineering(pssrId), onSuccess: invalidate }),
    addRequirement: useMutation({ mutationFn: (values: Record<string, any>) => pssrTestingCommissioningService.addRequirement(pssrId, values), onSuccess: invalidate }),
    pass: useMutation({ mutationFn: (testRecordId: string) => pssrTestingCommissioningService.pass(pssrId, testRecordId), onSuccess: invalidate }),
    fail: useMutation({ mutationFn: ({ testRecordId, reason }: { testRecordId: string; reason: string }) => pssrTestingCommissioningService.fail(pssrId, testRecordId, reason), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (testRecordId: string) => pssrTestingCommissioningService.verify(pssrId, testRecordId), onSuccess: invalidate }),
    requestVerification: useMutation({ mutationFn: (testRecordId: string) => pssrTestingCommissioningService.requestVerification(pssrId, testRecordId), onSuccess: invalidate })
  };
}
