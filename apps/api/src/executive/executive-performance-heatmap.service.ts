import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceHeatmapService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  heatmap(user: RequestUser, queryOrDto: Record<string, any> = {}) {
    return this.performance.heatmap(user, queryOrDto);
  }
}
