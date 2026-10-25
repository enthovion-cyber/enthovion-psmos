import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveScopeModuleScorecardService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  modules(user: RequestUser, scopeType: any, scopeId: string, query: Record<string, any> = {}) {
    return this.performance.modules(user, scopeType, scopeId, query);
  }
}
