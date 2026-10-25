import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutivePerformanceSnapshotService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  snapshots(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.snapshots(user, query);
  }
  snapshot(user: RequestUser, dto: Record<string, any> = {}) {
    return this.performance.snapshot(user, dto);
  }
  archive(user: RequestUser, id: string, dto: Record<string, any> = {}) {
    return this.performance.archiveSnapshot(user, id, dto);
  }
}
