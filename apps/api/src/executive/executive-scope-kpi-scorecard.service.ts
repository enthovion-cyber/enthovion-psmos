import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveScopeKpiScorecardService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  kpis(user: RequestUser, scopeType: any, scopeId: string, query: Record<string, any> = {}) {
    return this.performance.kpis(user, scopeType, scopeId, query);
  }
}
