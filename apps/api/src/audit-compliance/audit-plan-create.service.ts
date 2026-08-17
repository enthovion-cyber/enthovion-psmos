import { Injectable } from '@nestjs/common'; import { RequestUser } from '../common/decorators/current-user.decorator'; import { AuditPlanService } from './audit-plan.service';
@Injectable() export class AuditPlanCreateService { constructor(private readonly plans: AuditPlanService) {} create(user: RequestUser, dto: Record<string, any>) { return this.plans.create(user, dto); } }
