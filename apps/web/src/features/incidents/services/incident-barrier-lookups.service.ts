import { api } from '@/services/api';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const incidentBarrierLookupsService = {
  context: (id: string) => api.get(`/incidents/${id}/barriers/context`).then(unwrap<any>)
};
