import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingComplianceEngineService } from './training-compliance-engine.service';

@Injectable()
export class TrainingGapReconciliationService {
  constructor(private readonly engine: TrainingComplianceEngineService) {}
  reconcile(user: RequestUser, query: Record<string, any> = {}) {
    return this.engine.calculateCompany(user, query);
  }
}
