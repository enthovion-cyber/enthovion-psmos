import { api } from '@/services/api';
import { unwrap } from './billing.service';
import type { CompanySubscription } from '../types/subscription.types';

export const subscriptionService = {
  current: () => api.get('/billing/subscription').then(unwrap<CompanySubscription>)
};
