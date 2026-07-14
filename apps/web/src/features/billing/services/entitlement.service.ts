import { api } from '@/services/api';
import { unwrap } from './billing.service';
import type { CompanyEntitlement, EntitlementCheckResult } from '../types/entitlement.types';

export const entitlementService = {
  list: () => api.get('/billing/entitlements').then(unwrap<CompanyEntitlement[]>),
  modules: () => api.get('/entitlements/modules').then(unwrap<any>),
  navigationFilter: () => api.get('/entitlements/navigation-filter').then(unwrap<any>),
  check: (input: { entitlementKey?: string; moduleKey?: string; limitKey?: string; requestedValue?: number }) => api.post('/entitlements/check', input).then(unwrap<EntitlementCheckResult>)
};
