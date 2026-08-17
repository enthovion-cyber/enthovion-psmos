import { api } from '@/services/api';
import type { MiDashboard } from '../types/mi-dashboard.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const miDashboardService = {
  get(): Promise<MiDashboard> {
    return api.get('/mechanical-integrity/dashboard').then(unwrap<MiDashboard>);
  }
};
