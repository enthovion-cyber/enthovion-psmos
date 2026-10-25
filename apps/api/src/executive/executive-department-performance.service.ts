import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveDepartmentPerformanceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  departments(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.scopes(user, 'department', query);
  }
  department(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.performance.detail(user, 'department', id, query);
  }
}
