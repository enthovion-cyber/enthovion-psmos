import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveUnitPerformanceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  units(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.scopes(user, 'unit', query);
  }
  unit(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.performance.detail(user, 'unit', id, query);
  }
}
