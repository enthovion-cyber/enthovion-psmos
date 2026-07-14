'use client';

import { useQuery } from '@tanstack/react-query';
import { mocCommunicationTrainingService } from '../services/moc-communication-training.service';

export function useMOCCommunicationTraining(id: string) {
  return useQuery({ queryKey: ['moc', id, 'communication-training'], queryFn: () => mocCommunicationTrainingService.get(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}
