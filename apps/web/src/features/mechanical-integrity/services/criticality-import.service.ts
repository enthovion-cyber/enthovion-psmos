import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const criticalityImportService = {
  create(rows: Array<Record<string, unknown>>, fileName = 'criticality-import.csv') {
    return api.post('/mechanical-integrity/criticality/import', { rows, fileName }).then(unwrap<Record<string, unknown>>);
  },
  validate(jobId: string) {
    return api.post(`/mechanical-integrity/criticality/import/${jobId}/validate`).then(unwrap<Record<string, unknown>>);
  },
  commit(jobId: string) {
    return api.post(`/mechanical-integrity/criticality/import/${jobId}/commit`).then(unwrap<Record<string, unknown>>);
  }
};
