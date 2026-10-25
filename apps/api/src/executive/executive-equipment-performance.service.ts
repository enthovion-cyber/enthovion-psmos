import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutivePerformanceService } from './executive-performance.service';

@Injectable()
export class ExecutiveEquipmentPerformanceService {
  constructor(private readonly performance: ExecutivePerformanceService) {}
  equipment(user: RequestUser, query: Record<string, any> = {}) {
    return this.performance.scopes(user, 'equipment', query);
  }
  item(user: RequestUser, id: string, query: Record<string, any> = {}) {
    return this.performance.detail(user, 'equipment', id, query);
  }
}
