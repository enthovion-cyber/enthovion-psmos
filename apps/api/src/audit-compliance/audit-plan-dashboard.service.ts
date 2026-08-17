import { Injectable } from '@nestjs/common'; import { RequestUser } from '../common/decorators/current-user.decorator'; import { AuditPlanService } from './audit-plan.service';
@Injectable() export class AuditPlanDashboardService { constructor(private readonly plans: AuditPlanService) {} dashboard(user: RequestUser, query: Record<string, any> = {}) { return this.plans.dashboard(user, query); } }
