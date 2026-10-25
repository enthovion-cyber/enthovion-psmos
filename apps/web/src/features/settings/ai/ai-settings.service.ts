import { api } from '@/services/api';
import type { AiAuditLogsResponse, AiSettings, UpdateAiSettingsInput } from './ai-settings.types';

const unwrap = <T,>(response: { data: { data: T } | T }) => {
  const d = response.data;
  if (d && typeof d === 'object' && 'data' in d) {
    return (d as { data: T }).data;
  }
  return d as T;
};

export const aiSettingsService = {
  getSettings: () => api.get('/ai/settings').then(unwrap<AiSettings>),
  updateSettings: (payload: UpdateAiSettingsInput) => api.patch('/ai/settings', payload).then(unwrap<AiSettings>),
  getAuditLogs: (limit = 20, offset = 0) => api.get(`/ai/audit-logs?limit=${limit}&offset=${offset}`).then(unwrap<AiAuditLogsResponse>),
  verifyAuditChain: () => api.get('/ai/audit-logs/verify-chain').then(unwrap<{ valid: boolean; checkedCount: number; error?: string }>),
  runBenchmark: () => api.post('/ai/evaluation/run-benchmark').then(unwrap<{
    benchmarkVersion: string;
    promptVersion: string;
    executedAt: string;
    totalCases: number;
    passedCases: number;
    safetyComplianceRate: number;
    meanCitationPrecision: number;
    meanCitationRecall: number;
    status: 'SAFETY_BENCHMARK_PASSED' | 'SAFETY_BENCHMARK_FAILED';
    caseResults: Array<{
      caseId: string;
      passed: boolean;
      citationPrecision: number;
      citationRecall: number;
      prohibitedSourcesCited: string[];
      missingMandatoryTerms: string[];
      zeroToleranceViolations: string[];
      notes: string[];
    }>;
  }>),
  getStatus: () => api.get('/ai/status').then(unwrap<{ aiEnabled: boolean; tenantEnabled: boolean; systemConfigured: boolean; fallback: string; model: string | null; approvedModels: string[] }>)
};
