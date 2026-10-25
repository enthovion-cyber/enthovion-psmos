import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceRankingService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  rankings(user: RequestUser, queryOrDto: Record<string, any> = {}) {
    return this.performance.rankings(user, queryOrDto);
  }
}
