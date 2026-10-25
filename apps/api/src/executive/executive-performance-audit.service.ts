import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ExecutivePerformanceAuditService {
  constructor(private readonly audit: AuditService) {}
  async record(user: RequestUser, action: string, metadata: Record<string, any> = {}) {
    return this.audit.write({
      tenantId: user.companyIds[0] ?? '',
      actorId: user.id,
      action: `executive.performance.${action}`,
      entityType: 'ExecutivePerformance',
      metadata,
    });
  }
}
