import { api } from '@/services/api';
import { unwrap } from './billing.service';
import type { UsageCounter } from '../types/usage.types';

export const usageService = {
  company: () => api.get('/usage/company').then(unwrap<UsageCounter[]>),
  sites: () => api.get('/usage/sites').then(unwrap<UsageCounter[]>),
  recalculate: () => api.post('/usage/recalculate').then(unwrap<UsageCounter[]>),
  export: () => api.get('/usage/export').then(unwrap<{ rows: UsageCounter[]; format: string }>)
};
