import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceDrilldownService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  drilldown(user: RequestUser, queryOrDto: Record<string, any> = {}) {
    return this.performance.drilldown(user, queryOrDto);
  }
  children(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.drilldown(user, { ...query, mode: 'children' });
  }
  sourceRecords(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.drilldown(user, { ...query, mode: 'source-records' });
  }
}
