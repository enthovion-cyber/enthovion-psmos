import { api } from '@/services/api';
import type { PSSRCreateValues } from '../schemas/pssr-create.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrService = {
  context: () => api.get('/pssr/new/context').then(unwrap<any>),
  fromMocContext: (mocId: string) => api.get(`/pssr/new/from-moc/${mocId}/context`).then(unwrap<any>),
  equipmentSearch: (search: string) => api.get('/pssr/equipment-search', { params: { search } }).then(unwrap<any[]>),
  list: (params?: Record<string, any>) => api.get('/pssr', { params }).then(unwrap<any[]>),
  create: (values: PSSRCreateValues) => api.post('/pssr', values).then(unwrap<any>),
  triggerFromMoc: (mocId: string) => api.post(`/moc/${mocId}/pssr/trigger`, {}).then(unwrap<any>),
  get: (id: string) => api.get(`/pssr/${id}`).then(unwrap<any>),
  preview: (id: string) => api.get(`/pssr/${id}/preview`).then(unwrap<any>),
  update: (id: string, values: Partial<PSSRCreateValues>) => api.patch(`/pssr/${id}`, values).then(unwrap<any>),
  summary: (id: string) => api.get(`/pssr/${id}/summary`).then(unwrap<any>),
  overview: (id: string) => api.get(`/pssr/${id}/overview`).then(unwrap<any>),
  checklistPreview: (id: string) => api.get(`/pssr/${id}/generated-checklist-preview`).then(unwrap<any[]>),
  blockersPreview: (id: string) => api.get(`/pssr/${id}/startup-blockers-preview`).then(unwrap<any[]>),
  readinessCheck: (id: string) => api.post(`/pssr/${id}/readiness-check`).then(unwrap<any>),
  generateChecklist: (id: string) => api.post(`/pssr/${id}/generate-checklist`).then(unwrap<any>),
  syncLinkedMoc: (id: string) => api.post(`/pssr/${id}/sync-linked-moc`).then(unwrap<any>),
  transition: (id: string, action: string) => api.post(`/pssr/${id}/${action}`).then(unwrap<any>),
  linkedMoc: (id: string) => api.get(`/pssr/${id}/linked-moc`).then(unwrap<any>),
  equipment: (id: string) => api.get(`/pssr/${id}/equipment`).then(unwrap<any[]>),
  addEquipment: (id: string, values: { equipmentId: string; isPrimary?: boolean }) => api.post(`/pssr/${id}/equipment`, values).then(unwrap<any>),
  removeEquipment: (id: string, equipmentId: string) => api.delete(`/pssr/${id}/equipment/${equipmentId}`).then(unwrap<any>),
  blockers: (id: string) => api.get(`/pssr/${id}/startup-blockers`).then(unwrap<any[]>),
  history: (id: string) => api.get(`/pssr/${id}/history`).then(unwrap<any[]>),
  report: (id: string) => api.get(`/pssr/${id}/report`).then(unwrap<any>)
};
