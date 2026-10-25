import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceComparisonService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  compare(user: RequestUser, queryOrDto: Record<string, any> = {}) {
    return this.performance.compare(user, queryOrDto);
  }
}
