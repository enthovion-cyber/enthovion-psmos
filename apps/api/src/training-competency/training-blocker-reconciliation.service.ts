import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingDataQualityService } from './training-data-quality.service';

@Injectable()
export class TrainingBlockerReconciliationService {
  constructor(private readonly dataQuality: TrainingDataQualityService) {}
  reconcile(user: RequestUser, query: Record<string, any> = {}) {
    return this.dataQuality.run(user, query);
  }
}
