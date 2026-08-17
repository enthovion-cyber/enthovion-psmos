import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { AuditProgramService } from './audit-program.service';

@Injectable()
export class AuditDashboardService {
  constructor(private readonly programs: AuditProgramService) {}
  dashboard(user: RequestUser, query: Record<string, any>) { return this.programs.dashboard(user, query); }
  summary(user: RequestUser, query: Record<string, any>) { return this.programs.dashboardSummary(user, query); }
}
