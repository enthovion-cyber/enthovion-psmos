import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingComplianceSnapshotService } from './training-compliance-snapshot.service';

@Injectable()
export class TrainingExpiryRecalculationService {
  constructor(private readonly snapshots: TrainingComplianceSnapshotService) {}
  recalculate(user: RequestUser, dto: Record<string, any> = {}) {
    return this.snapshots.recalculate(user, { ...dto, recalculationReason: dto.reason ?? 'Expiry / overdue finalization' });
  }
}
