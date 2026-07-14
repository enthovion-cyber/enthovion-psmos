import { api } from '@/services/api';
import type { PublicMarketingConfig, PublicPlan } from '../types/public-plan.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const publicPlansService = {
  plans: () => api.get('/public/plans').then(unwrap<PublicPlan[]>),
  plan: (planCode: string) => api.get(`/public/plans/${planCode}`).then(unwrap<PublicPlan>),
  marketingConfig: () => api.get('/public/marketing-config').then(unwrap<PublicMarketingConfig>)
};
