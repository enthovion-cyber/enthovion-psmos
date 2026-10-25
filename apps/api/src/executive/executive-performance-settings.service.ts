import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { ExecutiveDashboardService } from './executive-dashboard.service';

@Injectable()
export class ExecutivePerformanceSettingsService {
  constructor(private readonly executive: ExecutiveDashboardService) {}
  settings(user: RequestUser) {
    return this.executive.settings(user);
  }
  update(user: RequestUser, dto: Record<string, any>) {
    return this.executive.updateSettings(user, dto);
  }
}
