import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveAreaPerformanceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  areas(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.scopes(user, 'area', query);
  }
  area(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.performance.detail(user, 'area', id, query);
  }
}
