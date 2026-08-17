import type { AuditLookups } from '../types/audit.types';
import { get } from './audit-api';

export const auditLookupsService = {
  all: async (): Promise<AuditLookups> => ({
    auditTypes: await get<string[]>('/audit-compliance/lookups/audit-types'),
    programCategories: await get<string[]>('/audit-compliance/lookups/program-categories'),
    programStatuses: await get<string[]>('/audit-compliance/lookups/program-statuses'),
    configurationHealthStatuses: await get<string[]>('/audit-compliance/lookups/configuration-health-statuses'),
    criticalityLevels: await get<string[]>('/audit-compliance/lookups/criticality-levels'),
    scopeTypes: await get<string[]>('/audit-compliance/lookups/scope-types'),
    auditFrequencies: await get<string[]>('/audit-compliance/lookups/audit-frequencies'),
    coverageLevels: await get<string[]>('/audit-compliance/lookups/coverage-levels'),
    auditableModules: await get<Array<{ key: string; name: string }>>('/audit-compliance/lookups/auditable-modules'),
    standardOptions: await get<string[]>('/audit-compliance/lookups/standard-options')
  })
};
