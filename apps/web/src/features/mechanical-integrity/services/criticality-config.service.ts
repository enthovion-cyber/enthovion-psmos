import { api } from '@/services/api';
import type { CriticalityConfig } from '../types/criticality-config.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const criticalityConfigService = {
  active() {
    return api.get('/mechanical-integrity/criticality/config').then(unwrap<{ active: CriticalityConfig; versions: Array<Record<string, unknown>>; lookups: Record<string, unknown> }>);
  },
  save(input: Record<string, unknown>) {
    return api.post('/mechanical-integrity/criticality/config', input).then(unwrap<CriticalityConfig>);
  },
  update(configId: string, input: Record<string, unknown>) {
    return api.patch(`/mechanical-integrity/criticality/config/${configId}`, input).then(unwrap<CriticalityConfig>);
  },
  impact(configId: string) {
    return api.get(`/mechanical-integrity/criticality/config/${configId}/impact-analysis`).then(unwrap<Record<string, unknown>>);
  }
};
