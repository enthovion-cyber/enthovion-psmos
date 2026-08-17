import { get, patch, post } from '../../services/psi-api';
import type { PsiHazopBasis, PsiIntegrationDashboard, PsiIntegrationLink, PsiMiReadiness, PsiMocImpact, PsiPaged, PsiPssrReadiness, PsiSyncCheck } from '../types/psi-integration.types';

const base = '/process-safety-information/integrations';

export const psiIntegrationService = {
  dashboard: (params?: Record<string, unknown>) => get<PsiIntegrationDashboard>(`${base}/dashboard`, params),
  summary: (params?: Record<string, unknown>) => get<Record<string, unknown>>(`${base}/summary`, params),
  impactRegister: (params?: Record<string, unknown>) => get<PsiPaged<PsiIntegrationLink>>(`${base}/impact-register`, params),
  detail: (id: string) => get<{ link: PsiIntegrationLink }>(`${base}/${id}`),
  update: (id: string, data: Record<string, unknown>) => patch<PsiIntegrationLink>(`${base}/${id}`, data),
  verify: (id: string, data?: Record<string, unknown>) => post<PsiIntegrationLink>(`${base}/${id}/verify`, data),
  close: (id: string, data: Record<string, unknown>) => post<PsiIntegrationLink>(`${base}/${id}/close`, data),
  reopen: (id: string, data: Record<string, unknown>) => post<PsiIntegrationLink>(`${base}/${id}/reopen`, data),
  createAction: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/create-action`, data),
  moc: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>(`${base}/moc`, params),
  pssr: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>(`${base}/pssr`, params),
  hazop: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>(`${base}/hazop`, params),
  mi: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>(`${base}/mechanical-integrity`, params),
  outOfSync: (params?: Record<string, unknown>) => get<PsiPaged<PsiSyncCheck>>(`${base}/out-of-sync`, params),
  runSync: (data?: Record<string, unknown>) => post<{ rows: PsiSyncCheck[] }>(`${base}/sync-check/run`, data),
  resolveSync: (id: string, data: Record<string, unknown>) => post<PsiSyncCheck>(`${base}/sync-checks/${id}/resolve`, data),
  createSyncAction: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/sync-checks/${id}/create-action`, data),
  history: (params?: Record<string, unknown>) => get<Record<string, unknown>[]>(`${base}/history`, params),
  settings: () => get<Record<string, unknown>>(`${base}/settings`),
  updateSettings: (data: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/settings`, data),
  export: (params?: Record<string, unknown>) => get<Record<string, unknown>>(`${base}/export`, params)
};

export const mocPsiImpactService = {
  get: (mocId: string) => get<PsiMocImpact>(`/moc/${mocId}/psi-impact`),
  run: (mocId: string, data?: Record<string, unknown>) => post<PsiMocImpact>(`/moc/${mocId}/psi-impact/run`, data),
  updateItem: (mocId: string, itemId: string, data: Record<string, unknown>) => patch<Record<string, unknown>>(`/moc/${mocId}/psi-impact/items/${itemId}`, data)
};

export const pssrPsiReadinessService = {
  get: (pssrId: string) => get<PsiPssrReadiness>(`/pssr/${pssrId}/psi-readiness`),
  run: (pssrId: string, data?: Record<string, unknown>) => post<PsiPssrReadiness>(`/pssr/${pssrId}/psi-readiness/run`, data)
};

export const hazopPsiBasisService = {
  get: (hazopId: string) => get<PsiHazopBasis>(`/hazop/${hazopId}/psi-basis`),
  link: (hazopId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/hazop/${hazopId}/psi-basis/link`, data),
  checkCurrent: (hazopId: string) => post<Record<string, unknown>>(`/hazop/${hazopId}/psi-basis/check-current`)
};

export const miPsiReadinessService = {
  get: (equipmentId: string) => get<PsiMiReadiness>(`/mechanical-integrity/equipment/${equipmentId}/psi-readiness`),
  run: (equipmentId: string, data?: Record<string, unknown>) => post<PsiMiReadiness>(`/mechanical-integrity/equipment/${equipmentId}/psi-readiness/run`, data),
  sync: (equipmentId: string, data?: Record<string, unknown>) => post<Record<string, unknown>>(`/mechanical-integrity/equipment/${equipmentId}/psi-sync-check`, data)
};
