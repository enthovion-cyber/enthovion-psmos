import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingDashboardAggregationService } from './training-dashboard-aggregation.service';

@Injectable()
export class TrainingFinalReportService {
  constructor(private readonly dashboard: TrainingDashboardAggregationService) {}
  generateIntegrationSummary(user: RequestUser, query: Record<string, any> = {}) {
    return this.dashboard.aggregate(user, query);
  }
}
