import { api } from '@/services/api';
import { unwrap } from './billing.service';
import type { SubscriptionPlan } from '../types/plan.types';

export const planService = {
  current: () => api.get('/billing/plan').then(unwrap<SubscriptionPlan | null>),
  list: () => api.get('/billing/plans').then(unwrap<SubscriptionPlan[]>)
};
