'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopSignoffService } from '../services/hazop-signoff.service';

export function useHazopSignoffMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'header'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'overview'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'signoffs'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-readiness'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-blockers'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-workflow'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop-dashboard'] });
  };
  return {
    generate: useMutation({
      mutationFn: () => hazopSignoffService.generate(studyId),
      onSuccess: (rows) => {
        queryClient.setQueryData(['hazop', studyId, 'signoffs'], rows);
        invalidate();
      }
    }),
    request: useMutation({
      mutationFn: ({ signoffId, values }: { signoffId: string; values?: Record<string, any> }) => hazopSignoffService.request(studyId, signoffId, values),
      onSuccess: (row) => {
        patchSignoffRow(queryClient, studyId, row);
        invalidate();
      }
    }),
    sign: useMutation({
      mutationFn: ({ signoffId, values }: { signoffId: string; values: Record<string, any> }) => hazopSignoffService.sign(studyId, signoffId, values),
      onSuccess: (row) => {
        patchSignoffRow(queryClient, studyId, row);
        invalidate();
      }
    }),
    reject: useMutation({
      mutationFn: ({ signoffId, values }: { signoffId: string; values: Record<string, any> }) => hazopSignoffService.reject(studyId, signoffId, values),
      onSuccess: (row) => {
        patchSignoffRow(queryClient, studyId, row);
        invalidate();
      }
    }),
    delegate: useMutation({ mutationFn: ({ signoffId, values }: { signoffId: string; values: Record<string, any> }) => hazopSignoffService.delegate(studyId, signoffId, values), onSuccess: invalidate }),
    supersede: useMutation({ mutationFn: ({ signoffId, values }: { signoffId: string; values: Record<string, any> }) => hazopSignoffService.supersede(studyId, signoffId, values), onSuccess: invalidate })
  };
}

function patchSignoffRow(queryClient: ReturnType<typeof useQueryClient>, studyId: string, row: any) {
  if (!row?.id) return;
  queryClient.setQueryData(['hazop', studyId, 'signoffs'], (current: any) => {
    const rows = Array.isArray(current) ? current : [];
    return rows.map((item) => item.id === row.id ? { ...item, ...row } : item);
  });
}
