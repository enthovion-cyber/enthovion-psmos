import { Injectable } from '@nestjs/common';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceLookupService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  lookups() {
    return this.performance.lookups();
  }
}
