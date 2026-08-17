import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { requiredTrainingService } from '../services/required-training.service';

export function useCreateRequiredTraining() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => requiredTrainingService.create(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['required-training'] });
      router.push(`/training-competency/required-training/library/${data.item.id}`);
    }
  });
}

export function useUpdateRequiredTraining(trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => requiredTrainingService.update(trainingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['required-training'] })
  });
}

export function useRequiredTrainingAction(trainingId: string, action: 'activate' | 'archive' | 'reactivate' | 'newVersion' | 'submitReview' | 'approve' | 'syncToMatrix' | 'syncToCompetencyProfiles') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown> = {}) => {
      if (action === 'activate') return requiredTrainingService.activate(trainingId);
      if (action === 'archive') return requiredTrainingService.archive(trainingId, data);
      if (action === 'reactivate') return requiredTrainingService.reactivate(trainingId, data);
      if (action === 'newVersion') return requiredTrainingService.newVersion(trainingId, data);
      if (action === 'submitReview') return requiredTrainingService.submitReview(trainingId, data);
      if (action === 'approve') return requiredTrainingService.approve(trainingId, data);
      if (action === 'syncToMatrix') return requiredTrainingService.syncToMatrix(trainingId);
      return requiredTrainingService.syncToCompetencyProfiles(trainingId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['required-training'] })
  });
}

export function useRequiredTrainingChildMutation(trainingId: string, kind: 'content' | 'delivery' | 'evidence' | 'scope' | 'link' | 'document' | 'matrix' | 'competency') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (kind === 'content') return requiredTrainingService.addContent(trainingId, data);
      if (kind === 'delivery') return requiredTrainingService.updateDeliveryRules(trainingId, data);
      if (kind === 'evidence') return requiredTrainingService.updateEvidenceRules(trainingId, data);
      if (kind === 'scope') return requiredTrainingService.addApplicability(trainingId, data);
      if (kind === 'link') return requiredTrainingService.addLink(trainingId, data);
      if (kind === 'document') return requiredTrainingService.linkDocument(trainingId, data);
      if (kind === 'matrix') return requiredTrainingService.addMatrixLink(trainingId, data);
      return requiredTrainingService.addCompetencyLink(trainingId, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['required-training'] })
  });
}
