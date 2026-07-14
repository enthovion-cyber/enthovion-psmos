'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopAttachmentService } from '../services/hazop-attachment.service';
import type { HazopAttachmentFilters } from '../types/hazop-attachment.types';

export function useHazopAttachments(studyId: string, filters: HazopAttachmentFilters) {
  const enabled = Boolean(studyId);
  return {
    summary: useQuery({ queryKey: ['hazop', studyId, 'attachment-summary'], queryFn: () => hazopAttachmentService.summary(studyId), enabled }),
    attachments: useQuery({ queryKey: ['hazop', studyId, 'attachments', filters], queryFn: () => hazopAttachmentService.list(studyId, filters), enabled })
  };
}
