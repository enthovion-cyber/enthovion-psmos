'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocCommunicationTrainingService } from '../services/moc-communication-training.service';

export function useMOCCommunicationTrainingMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'communication-training'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'pssr-startup'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closed-loop-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'history'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    ]);
  };
  return {
    createStakeholder: useMutation({ mutationFn: (v: any) => mocCommunicationTrainingService.createStakeholder(id, v), onSuccess: refresh }),
    importFromImpact: useMutation({ mutationFn: () => mocCommunicationTrainingService.importFromImpact(id), onSuccess: refresh }),
    importFromEquipment: useMutation({ mutationFn: () => mocCommunicationTrainingService.importFromEquipment(id), onSuccess: refresh }),
    updatePlan: useMutation({ mutationFn: (v: any) => mocCommunicationTrainingService.updatePlan(id, v), onSuccess: refresh }),
    sendCommunication: useMutation({ mutationFn: (v: any) => mocCommunicationTrainingService.sendCommunication(id, v), onSuccess: refresh }),
    scheduleCommunication: useMutation({ mutationFn: (v: any) => mocCommunicationTrainingService.scheduleCommunication(id, v), onSuccess: refresh }),
    acknowledge: useMutation({ mutationFn: ({ ackId, values }: any) => mocCommunicationTrainingService.acknowledge(id, ackId, values), onSuccess: refresh }),
    waiveAck: useMutation({ mutationFn: ({ ackId, values }: any) => mocCommunicationTrainingService.waiveAck(id, ackId, values), onSuccess: refresh }),
    createTraining: useMutation({ mutationFn: (v: any) => mocCommunicationTrainingService.createTraining(id, v), onSuccess: refresh }),
    generateTrainingFromImpact: useMutation({ mutationFn: () => mocCommunicationTrainingService.generateTrainingFromImpact(id), onSuccess: refresh }),
    completeAssignment: useMutation({ mutationFn: ({ assignmentId, values }: any) => mocCommunicationTrainingService.completeAssignment(id, assignmentId, values), onSuccess: refresh }),
    verifyAssignment: useMutation({ mutationFn: ({ assignmentId, values }: any) => mocCommunicationTrainingService.verifyAssignment(id, assignmentId, values), onSuccess: refresh })
  };
}
