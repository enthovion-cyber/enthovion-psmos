import { Injectable } from '@nestjs/common'; import { RequestUser } from '../common/decorators/current-user.decorator'; import { AuditPlanService } from './audit-plan.service';
@Injectable() export class AuditPlanCalendarService { constructor(private readonly plans: AuditPlanService) {} calendar(user: RequestUser, query: Record<string, any> = {}) { return this.plans.calendar(user, query); } }
