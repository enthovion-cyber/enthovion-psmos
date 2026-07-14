import { api } from '@/services/api';

function unwrap<T>(response: { data: { data?: T } | T }) {
  const payload = response.data as any;
  return (payload?.data ?? payload) as T;
}

function rows(response: { data: { data?: any[] } | any[] }) {
  const payload = unwrap<any>(response);
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
}

export const hazopSignoffService = {
  list: (studyId: string) => api.get(`/hazop/${studyId}/signoffs`).then(rows),
  generate: (studyId: string) => api.post(`/hazop/${studyId}/signoffs/generate`).then(rows),
  request: (studyId: string, signoffId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/signoffs/${signoffId}/request`, values ?? {}).then(unwrap<any>),
  sign: (studyId: string, signoffId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/signoffs/${signoffId}/sign`, values).then(unwrap<any>),
  reject: (studyId: string, signoffId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/signoffs/${signoffId}/reject`, values).then(unwrap<any>),
  delegate: (studyId: string, signoffId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/signoffs/${signoffId}/delegate`, values).then(unwrap<any>),
  supersede: (studyId: string, signoffId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/signoffs/${signoffId}/supersede`, values).then(unwrap<any>)
};
