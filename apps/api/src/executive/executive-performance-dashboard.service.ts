import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceDashboardService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  dashboard(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.dashboard(user, query);
  }
}
