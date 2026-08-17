import { Injectable } from '@nestjs/common';
import { auditFrequencies, auditTypes, auditableModules, configurationHealthStatuses, coverageLevels, criticalityLevels, programCategories, programStatuses, scopeTypes, standardOptions } from './audit-compliance.constants';

@Injectable()
export class AuditLookupService {
  all() {
    return { auditTypes, programCategories, programStatuses, configurationHealthStatuses, criticalityLevels, scopeTypes, auditFrequencies, coverageLevels, auditableModules: auditableModules.map(([key, name]) => ({ key, name })), standardOptions };
  }
  byName(name: string) {
    return (this.all() as Record<string, unknown>)[name] ?? [];
  }
}
