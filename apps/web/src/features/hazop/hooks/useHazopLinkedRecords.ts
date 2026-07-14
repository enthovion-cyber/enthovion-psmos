'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopLinkedRecordService } from '../services/hazop-linked-record.service';
import type { HazopLinkedRecordFilters } from '../types/hazop-linked-record.types';

export function useHazopLinkedRecords(studyId: string, filters: HazopLinkedRecordFilters) {
  const enabled = Boolean(studyId);
  return {
    summary: useQuery({ queryKey: ['hazop', studyId, 'linked-records-summary'], queryFn: () => hazopLinkedRecordService.summary(studyId), enabled }),
    context: useQuery({ queryKey: ['hazop', studyId, 'linked-records-context'], queryFn: () => hazopLinkedRecordService.context(studyId), enabled }),
    records: useQuery({ queryKey: ['hazop', studyId, 'linked-records', filters], queryFn: () => hazopLinkedRecordService.list(studyId, filters), enabled }),
    blockers: useQuery({ queryKey: ['hazop', studyId, 'linked-records-blockers'], queryFn: () => hazopLinkedRecordService.blockers(studyId), enabled })
  };
}
