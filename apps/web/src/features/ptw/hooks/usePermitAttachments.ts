import { useQuery } from '@tanstack/react-query';
import { ptwAttachmentService } from '../services/ptw-attachment.service';

export function usePermitAttachments(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'attachments'], queryFn: () => ptwAttachmentService.list(permitId) });
}

export function usePermitAttachmentSummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'attachments', 'summary'], queryFn: () => ptwAttachmentService.summary(permitId) });
}

export function usePermitAttachmentRequirements(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'attachments', 'requirements'], queryFn: () => ptwAttachmentService.requirementsForPermit(permitId) });
}

export function useAttachmentRequirementRules() {
  return useQuery({ queryKey: ['ptw', 'attachment-requirements'], queryFn: () => ptwAttachmentService.requirements() });
}
