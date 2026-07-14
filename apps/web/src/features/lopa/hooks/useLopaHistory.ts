import { useQuery } from '@tanstack/react-query';
import { lopaHistoryService } from '../services/lopa-history.service';
import type { LopaAttachmentFilters } from '../types/lopa-attachment.types';
export function useLopaHistory(id: string, filters: LopaAttachmentFilters = {}) { return useQuery({ queryKey: ['lopa', 'history', id, filters], queryFn: () => lopaHistoryService.get(id, filters), enabled: !!id }); }
