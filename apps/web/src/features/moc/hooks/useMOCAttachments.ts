'use client';

import { useQuery } from '@tanstack/react-query';
import { mocAttachmentsService } from '../services/moc-attachments.service';

export function useMOCAttachments(id: string) {
  const attachments = useQuery({ queryKey: ['moc', id, 'attachments'], queryFn: () => mocAttachmentsService.list(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  const summary = useQuery({ queryKey: ['moc', id, 'attachments-summary'], queryFn: () => mocAttachmentsService.summary(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  return { attachments, summary };
}
