import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingPermissionAuditService } from './training-permission-audit.service';
import { TrainingRlsAuditService } from './training-rls-audit.service';

@Injectable()
export class TrainingFinalAuditService {
  constructor(private readonly permissions: TrainingPermissionAuditService, private readonly rls: TrainingRlsAuditService) {}
  async audit(user: RequestUser) {
    const [permissions, rls] = await Promise.all([Promise.resolve(this.permissions.audit(user)), this.rls.audit()]);
    return { permissions, rls, auditedAt: new Date().toISOString() };
  }
}
