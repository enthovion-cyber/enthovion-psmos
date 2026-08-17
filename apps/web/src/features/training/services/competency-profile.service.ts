import { get, patch, post, remove } from './training-api';

const base = '/training-competency/roles-competency-profiles';

export const competencyProfileService = {
  dashboard: (params?: Record<string, unknown>) => get<Record<string, any>>(`${base}/dashboard`, params),
  profiles: (params?: Record<string, unknown>) => get<Record<string, any>>(`${base}/profiles`, params),
  profile: (profileId: string) => get<Record<string, any>>(`${base}/profiles/${profileId}`),
  createProfile: (data: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles`, data),
  updateProfile: (profileId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`${base}/profiles/${profileId}`, data),
  archiveProfile: (profileId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles/${profileId}/archive`, data),
  activateProfile: (profileId: string) => post<Record<string, any>>(`${base}/profiles/${profileId}/activate`),
  newVersion: (profileId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles/${profileId}/new-version`, data),
  submitReview: (profileId: string, data?: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles/${profileId}/submit-review`, data),
  approve: (profileId: string, data?: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles/${profileId}/approve`, data),
  duties: (profileId: string) => get<Record<string, any>[]>(`${base}/profiles/${profileId}/duties`),
  createDuty: (profileId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles/${profileId}/duties`, data),
  updateDuty: (profileId: string, dutyId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`${base}/profiles/${profileId}/duties/${dutyId}`, data),
  removeDuty: (profileId: string, dutyId: string, data?: Record<string, unknown>) => remove<Record<string, any>>(`${base}/profiles/${profileId}/duties/${dutyId}`, data),
  requirements: (profileId: string) => get<Record<string, any>[]>(`${base}/profiles/${profileId}/requirements`),
  createRequirement: (profileId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/profiles/${profileId}/requirements`, data),
  updateRequirement: (profileId: string, requirementId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`${base}/profiles/${profileId}/requirements/${requirementId}`, data),
  removeRequirement: (profileId: string, requirementId: string, data?: Record<string, unknown>) => remove<Record<string, any>>(`${base}/profiles/${profileId}/requirements/${requirementId}`, data),
  syncToMatrix: (profileId: string) => post<Record<string, any>>(`${base}/profiles/${profileId}/sync-to-matrix`),
  matrixSyncStatus: (profileId: string) => get<Record<string, any>>(`${base}/profiles/${profileId}/matrix-sync-status`),
  previewMatrixImpact: (profileId: string) => post<Record<string, any>>(`${base}/profiles/${profileId}/preview-matrix-impact`),
  history: (params?: Record<string, unknown>) => get<Record<string, any>>(`${base}/history`, params)
};
