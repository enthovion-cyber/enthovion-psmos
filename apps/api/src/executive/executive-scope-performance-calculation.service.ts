import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveScopePerformanceCalculationService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  recalculate(user: RequestUser, dto: Record<string, any> = {}) {
    return this.performance.recalculate(user, dto);
  }
}
