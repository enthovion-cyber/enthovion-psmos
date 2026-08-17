import { api } from '@/services/api';
import type { MiInspectionPlanImportJob } from '../types/inspection-plan-import.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const inspectionPlanImportService = {
  create(rows: Array<Record<string, unknown>>, fileName = 'inspection-plans.csv'): Promise<MiInspectionPlanImportJob> {
    return api.post('/mechanical-integrity/inspection-plans/import', { rows, fileName }).then(unwrap<MiInspectionPlanImportJob>);
  },
  get(jobId: string): Promise<MiInspectionPlanImportJob> {
    return api.get(`/mechanical-integrity/inspection-plans/import/${jobId}`).then(unwrap<MiInspectionPlanImportJob>);
  },
  validate(jobId: string): Promise<MiInspectionPlanImportJob> {
    return api.post(`/mechanical-integrity/inspection-plans/import/${jobId}/validate`).then(unwrap<MiInspectionPlanImportJob>);
  },
  commit(jobId: string): Promise<MiInspectionPlanImportJob> {
    return api.post(`/mechanical-integrity/inspection-plans/import/${jobId}/commit`).then(unwrap<MiInspectionPlanImportJob>);
  }
};
