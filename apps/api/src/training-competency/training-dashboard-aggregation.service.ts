import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingComplianceEngineService } from './training-compliance-engine.service';
import { TrainingDataQualityService } from './training-data-quality.service';
import { TrainingIntegrationHealthService } from './training-integration-health.service';

@Injectable()
export class TrainingDashboardAggregationService {
  constructor(private readonly compliance: TrainingComplianceEngineService, private readonly dataQuality: TrainingDataQualityService, private readonly health: TrainingIntegrationHealthService) {}
  async aggregate(user: RequestUser, query: Record<string, any> = {}) {
    const [compliance, dataQualityIssues, integrationHealth] = await Promise.all([
      this.compliance.calculateCompany(user, query),
      this.dataQuality.list(user, { ...query, limit: 25 }),
      this.health.list(user, { ...query, limit: 25 })
    ]);
    return { compliance, dataQualityIssues, integrationHealth, generatedAt: new Date().toISOString() };
  }
}
