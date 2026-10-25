import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveCompanyPerformanceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  company(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.company(user, query);
  }
}
