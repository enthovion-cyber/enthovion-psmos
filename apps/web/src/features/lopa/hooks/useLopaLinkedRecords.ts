import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaLinkedRecordService } from '../services/lopa-linked-record.service';
import type { LopaLinkedRecordFilters, LopaLinkedRecordInput } from '../types/lopa-linked-record.types';

export function useLopaLinkedRecords(id: string, filters: LopaLinkedRecordFilters = {}) {
  return useQuery({ queryKey: ['lopa', 'linked-records', id, filters], queryFn: () => lopaLinkedRecordService.get(id, filters), enabled: !!id });
}

export function useLopaLinkedRecordMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lopa', 'linked-records', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'detail', id] });
  };
  return {
    create: useMutation({ mutationFn: (values: LopaLinkedRecordInput) => lopaLinkedRecordService.create(id, values), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ linkId, values }: { linkId: string; values: LopaLinkedRecordInput }) => lopaLinkedRecordService.update(id, linkId, values), onSuccess: refresh }),
    remove: useMutation({ mutationFn: ({ linkId, reason }: { linkId: string; reason?: string | undefined }) => lopaLinkedRecordService.remove(id, linkId, reason), onSuccess: refresh }),
    sync: useMutation({ mutationFn: (linkId: string) => lopaLinkedRecordService.sync(id, linkId), onSuccess: refresh }),
    syncAll: useMutation({ mutationFn: () => lopaLinkedRecordService.syncAll(id), onSuccess: refresh }),
    compare: useMutation({ mutationFn: (linkId: string) => lopaLinkedRecordService.compare(id, linkId) }),
    export: useMutation({ mutationFn: (filters: LopaLinkedRecordFilters) => lopaLinkedRecordService.export(id, filters) })
  };
}

export function useLopaLinkedRecordSources(id: string, filters: LopaLinkedRecordFilters = {}) {
  return useQuery({ queryKey: ['lopa', 'linked-record-sources', id, filters], queryFn: () => lopaLinkedRecordService.sources(id, filters), enabled: !!id });
}
