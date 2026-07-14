'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocService } from '../services/moc.service';

export function useMOCMutation(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['moc', id] });
    await queryClient.invalidateQueries({ queryKey: ['moc'] });
  };
  const mutate = <TArgs extends unknown[], TResult>(mutationFn: (...args: TArgs) => Promise<TResult>) => useMutation({ mutationFn, onSuccess: refresh });
  return {
    update: mutate((values: Record<string, any>) => mocService.update(id, values)),
    submit: mutate(() => mocService.submit(id)),
    approve: mutate((comment?: string) => mocService.approve(id, comment)),
    reject: mutate((comment?: string) => mocService.reject(id, comment)),
    returnForRevision: mutate((comment?: string) => mocService.returnForRevision(id, comment)),
    startImplementation: mutate((comment?: string) => mocService.startImplementation(id, comment)),
    markImplementationComplete: mutate((comment?: string) => mocService.markImplementationComplete(id, comment)),
    readyForStartup: mutate((comment?: string) => mocService.readyForStartup(id, comment)),
    close: mutate((comment?: string) => mocService.close(id, comment)),
    cancel: mutate((comment?: string) => mocService.cancel(id, comment)),
    duplicate: mutate(() => mocService.duplicate(id)),
    updateRisk: mutate((values: Record<string, any>) => mocService.updateRisk(id, values)),
    updateImpact: mutate((values: Record<string, any>) => mocService.updateImpact(id, values)),
    generateActions: mutate(() => mocService.generateRequiredActions(id)),
    addAction: mutate((values: Record<string, any>) => mocService.addRequiredAction(id, values)),
    updateAction: mutate(({ actionId, values }: { actionId: string; values: Record<string, any> }) => mocService.updateRequiredAction(id, actionId, values)),
    linkDocument: mutate((values: Record<string, any>) => mocService.linkEngineeringDocument(id, values)),
    updateTemporary: mutate((values: Record<string, any>) => mocService.updateTemporaryControl(id, values)),
    extendTemporary: mutate((values: Record<string, any>) => mocService.extendTemporaryControl(id, values)),
    updateEmergency: mutate((values: Record<string, any>) => mocService.updateEmergencyControl(id, values)),
    completeEmergencyReview: mutate((values: Record<string, any>) => mocService.completeEmergencyReview(id, values)),
    triggerPssr: mutate((values: Record<string, any>) => mocService.triggerPssr(id, values)),
    addStakeholder: mutate((values: Record<string, any>) => mocService.addStakeholder(id, values)),
    addCommunication: mutate((values: Record<string, any>) => mocService.addCommunication(id, values)),
    addTraining: mutate((values: Record<string, any>) => mocService.addTrainingRequirement(id, values))
  };
}
