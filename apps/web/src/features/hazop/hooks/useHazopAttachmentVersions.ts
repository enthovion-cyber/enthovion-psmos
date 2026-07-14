'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopAttachmentService } from '../services/hazop-attachment.service';

export function useHazopAttachmentVersions(studyId: string, attachmentId?: string | null) {
  return useQuery({ queryKey: ['hazop', studyId, 'attachments', attachmentId, 'versions'], queryFn: () => hazopAttachmentService.versions(studyId, attachmentId!), enabled: Boolean(studyId && attachmentId) });
}
