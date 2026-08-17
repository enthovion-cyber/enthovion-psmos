import type { TrainingFinalIntegrationDashboard, TrainingFinalSettings } from '../types/training-final-integration.types';
import { get, patch, post } from './training-api';

const base = '/training-competency/final-integration';

export const trainingFinalIntegrationService = {
  dashboard: (params: Record<string, unknown> = {}) => get<TrainingFinalIntegrationDashboard>(`${base}/dashboard`, params),
  compliance: (params: Record<string, unknown> = {}) => get<Record<string, any>>(`${base}/compliance`, params),
  snapshots: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>(`${base}/compliance-snapshots`, params),
  recalculateSnapshots: (data: Record<string, unknown> = {}) => post<Record<string, any>>(`${base}/compliance-snapshots/recalculate`, data),
  integrationHealth: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>(`${base}/integration-health`, params),
  runIntegrationHealth: (data: Record<string, unknown> = {}) => post<Record<string, any>>(`${base}/integration-health/run`, data),
  dataQuality: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>(`${base}/data-quality`, params),
  runDataQuality: (data: Record<string, unknown> = {}) => post<Record<string, any>>(`${base}/data-quality/run`, data),
  syncEvents: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>(`${base}/sync-events`, params),
  hardeningChecks: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>(`${base}/hardening-checks`, params),
  runHardening: (data: Record<string, unknown> = {}) => post<Record<string, any>>(`${base}/hardening-checks/run`, data),
  routeHealth: () => get<Array<Record<string, any>>>(`${base}/route-health`),
  permissionAudit: () => get<Array<Record<string, any>>>(`${base}/permission-audit`),
  rlsAudit: () => get<Array<Record<string, any>>>(`${base}/rls-audit`),
  settings: () => get<TrainingFinalSettings>(`${base}/settings`),
  updateSettings: (data: Record<string, unknown>) => patch<TrainingFinalSettings>(`${base}/settings`, data),
  history: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>(`${base}/history`, params),
  audit: () => get<Record<string, any>>(`${base}/audit`)
};
