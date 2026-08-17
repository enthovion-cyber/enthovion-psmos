import { get } from '@/features/audit/services/audit-api';
import type { RegulatoryLookups } from '../types/regulatory.types';

export const regulatoryLookupsService = {
  all: async (): Promise<RegulatoryLookups> => {
    const [sourceTypes, categories, jurisdictionLevels, criticalityLevels, registerStatuses, applicabilityStatuses, complianceStatuses, reviewStatuses, reviewFrequencies, linkModules] = await Promise.all([
      get<{ rows: string[] }>('/regulatory/lookups/source-types'),
      get<{ rows: string[] }>('/regulatory/lookups/categories'),
      get<{ rows: string[] }>('/regulatory/lookups/jurisdiction-levels'),
      get<{ rows: string[] }>('/regulatory/lookups/criticality-levels'),
      get<{ rows: string[] }>('/regulatory/lookups/register-statuses'),
      get<{ rows: string[] }>('/regulatory/lookups/applicability-statuses'),
      get<{ rows: string[] }>('/regulatory/lookups/compliance-statuses'),
      get<{ rows: string[] }>('/regulatory/lookups/review-statuses'),
      get<{ rows: string[] }>('/regulatory/lookups/review-frequencies'),
      get<{ rows: string[] }>('/regulatory/lookups/link-modules')
    ]);
    return {
      sourceTypes: sourceTypes.rows,
      categories: categories.rows,
      jurisdictionLevels: jurisdictionLevels.rows,
      criticalityLevels: criticalityLevels.rows,
      registerStatuses: registerStatuses.rows,
      applicabilityStatuses: applicabilityStatuses.rows,
      complianceStatuses: complianceStatuses.rows,
      reviewStatuses: reviewStatuses.rows,
      reviewFrequencies: reviewFrequencies.rows,
      linkModules: linkModules.rows
    };
  }
};
