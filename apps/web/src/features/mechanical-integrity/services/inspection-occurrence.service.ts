import { api } from '@/services/api';
import type { MiInspectionOccurrence } from '../types/inspection-occurrence.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const inspectionOccurrenceService = {
  list(planId: string): Promise<MiInspectionOccurrence[]> {
    return api.get(`/mechanical-integrity/inspection-plans/${planId}/schedule/occurrences`).then(unwrap<MiInspectionOccurrence[]>);
  }
};
