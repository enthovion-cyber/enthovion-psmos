import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ptwService, type CreatePermitInput } from '@/services/ptw.service';

export function usePermitDashboard() {
  return useQuery({ queryKey: ['ptw', 'dashboard'], queryFn: () => ptwService.dashboard(), refetchInterval: 30000 });
}

export function usePermits(params?: Record<string, string>) {
  return useQuery({ queryKey: ['ptw', params], queryFn: () => ptwService.list(params) });
}

export function usePermitMap() {
  return useQuery({ queryKey: ['ptw', 'map'], queryFn: () => ptwService.map(), refetchInterval: 30000 });
}

export function usePermit(id: string) {
  return useQuery({ queryKey: ['ptw', id], queryFn: () => ptwService.get(id), enabled: Boolean(id), refetchInterval: 30000 });
}

export function usePermitMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    id ? queryClient.invalidateQueries({ queryKey: ['ptw', id] }) : Promise.resolve()
  ]);
  return {
    create: useMutation({ mutationFn: (input: CreatePermitInput) => ptwService.create(input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: () => ptwService.submit(id!), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: () => ptwService.approve(id!), onSuccess: invalidate }),
    issue: useMutation({ mutationFn: () => ptwService.issue(id!), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: () => ptwService.activate(id!), onSuccess: invalidate }),
    suspend: useMutation({ mutationFn: (reason: string) => ptwService.suspend(id!, reason), onSuccess: invalidate }),
    extend: useMutation({ mutationFn: ({ newExpiryAt, reason }: { newExpiryAt: string; reason: string }) => ptwService.extend(id!, newExpiryAt, reason), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (notes?: string) => ptwService.close(id!, notes), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (reason: string) => ptwService.cancel(id!, reason), onSuccess: invalidate }),
    clone: useMutation({ mutationFn: () => ptwService.clone(id!), onSuccess: invalidate }),
    createMocAction: useMutation({ mutationFn: () => ptwService.createMocAction(id!), onSuccess: invalidate }),
    saveTemplate: useMutation({ mutationFn: () => ptwService.saveTemplate(id!), onSuccess: invalidate }),
    addGasTest: useMutation({ mutationFn: () => ptwService.addGasTest(id!, { o2: 20.8, lel: 0, h2s: 0, co: 0, customGases: { so2: 0, cl2: 0, nh3: 0, hf: 0 }, instrumentId: 'GTR-1855' } as any), onSuccess: invalidate }),
    addIsolation: useMutation({ mutationFn: () => ptwService.addIsolation(id!, { energyType: 'Mechanical', sourceDescription: 'Field isolation point', isolationPoint: `ISO-${Date.now().toString().slice(-4)}`, requiredPosition: 'Closed', lockNumber: `L-${Date.now().toString().slice(-3)}` } as any), onSuccess: invalidate }),
    confirmIsolation: useMutation({ mutationFn: (isolationId: string) => ptwService.confirmIsolation(id!, isolationId), onSuccess: invalidate }),
    deisolate: useMutation({ mutationFn: () => ptwService.deisolate(id!), onSuccess: invalidate }),
    acknowledgeBriefing: useMutation({ mutationFn: (workerId: string) => ptwService.updateWorkforce(id!, workerId, { signedBriefing: true, signature: `Briefing acknowledged ${new Date().toISOString()}` }), onSuccess: invalidate }),
    signIn: useMutation({ mutationFn: (workerId: string) => ptwService.signIn(id!, workerId), onSuccess: invalidate }),
    signOut: useMutation({ mutationFn: (workerId: string) => ptwService.signOut(id!, workerId), onSuccess: invalidate }),
    handover: useMutation({ mutationFn: () => ptwService.handover(id!, { outgoingShift: 'Day Shift 07:00 - 19:00', incomingShift: 'Night Shift 19:00 - 07:00', acknowledgement: 'Incoming supervisor acknowledged active permit risks.', checklist: { workScopeReviewed: true, gasTestValid: true, isolationValidity: true, openConflictsReviewed: true } }), onSuccess: invalidate }),
    overrideConflict: useMutation({ mutationFn: ({ conflictId, reason }: { conflictId: string; reason: string }) => ptwService.overrideConflict(id!, conflictId, reason), onSuccess: invalidate }),
    checklist: useMutation({ mutationFn: (items: Record<string, boolean>) => ptwService.closureChecklist(id!, items), onSuccess: invalidate }),
    addAttachment: useMutation({ mutationFn: (file: File) => ptwService.addAttachment(id!, { file, title: file.name, fileName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size }), onSuccess: invalidate }),
    deleteAttachment: useMutation({ mutationFn: (attachmentId: string) => ptwService.deleteAttachment(id!, attachmentId), onSuccess: invalidate }),
    addSignature: useMutation({ mutationFn: (signatureType: string) => ptwService.addSignature(id!, { signatureType, signature: `Signed ${new Date().toISOString()}` }), onSuccess: invalidate })
  };
}
