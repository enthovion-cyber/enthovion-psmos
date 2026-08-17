import { get, patch, post, remove } from './training-api';
import type { CertificateDetail, CertificateRegister, CertificationDashboard, TrainingCertificate } from '../types/certification.types';

const base = '/training-competency/certifications';

export const certificationService = {
  dashboard: (params?: Record<string, unknown>) => get<CertificationDashboard>(`${base}/dashboard`, params),
  register: (params?: Record<string, unknown>) => get<CertificateRegister>(`${base}/register`, params),
  filtered: (view: 'expiring' | 'expired' | 'missing' | 'pending-verification' | 'rejected' | 'safety-critical', params?: Record<string, unknown>) => get<CertificateRegister>(`${base}/${view}`, params),
  detail: (certificateId: string) => get<CertificateDetail>(`${base}/${certificateId}`),
  create: (payload: Record<string, unknown>) => post<TrainingCertificate>(base, payload),
  update: (certificateId: string, payload: Record<string, unknown>) => patch<TrainingCertificate>(`${base}/${certificateId}`, payload),
  verify: (certificateId: string, payload?: Record<string, unknown>) => post<TrainingCertificate>(`${base}/${certificateId}/verify`, payload),
  reject: (certificateId: string, payload: Record<string, unknown>) => post<TrainingCertificate>(`${base}/${certificateId}/reject`, payload),
  renew: (certificateId: string, payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${certificateId}/renew`, payload),
  revoke: (certificateId: string, payload: Record<string, unknown>) => post<TrainingCertificate>(`${base}/${certificateId}/revoke`, payload),
  archive: (certificateId: string, payload?: Record<string, unknown>) => post<TrainingCertificate>(`${base}/${certificateId}/archive`, payload),
  linkDocument: (certificateId: string, payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${certificateId}/documents/link`, payload),
  removeDocument: (certificateId: string, documentLinkId: string, payload: Record<string, unknown>) => remove<Record<string, unknown>>(`${base}/${certificateId}/documents/${documentLinkId}`, payload),
  importTemplate: () => get<Record<string, unknown>>(`${base}/import-template`),
  importRows: (payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/import`, payload),
  exportRows: (params?: Record<string, unknown>) => get<Record<string, unknown>>(`${base}/export`, params),
  worker: (workerId: string, params?: Record<string, unknown>) => get<CertificateRegister>(`/training-competency/workforce/${workerId}/certifications`, params),
  requiredTraining: (trainingId: string, params?: Record<string, unknown>) => get<CertificateRegister>(`/training-competency/required-training/library/${trainingId}/certifications`, params)
};
