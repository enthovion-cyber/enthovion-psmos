import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveSitePerformanceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  sites(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.scopes(user, 'site', query);
  }
  site(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.performance.detail(user, 'site', id, query);
  }
}
