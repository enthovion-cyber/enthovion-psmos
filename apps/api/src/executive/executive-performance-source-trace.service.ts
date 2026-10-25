import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceSourceTraceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  items(user: RequestUser, scopeType: any, scopeId: string, query: Record<string, any> = {}) {
    return this.performance.items(user, scopeType, scopeId, 'source-trace', query);
  }
}
