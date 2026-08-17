import { Injectable } from '@nestjs/common'; import { RequestUser } from '../common/decorators/current-user.decorator'; import { AuditPlanService } from './audit-plan.service';
@Injectable() export class AuditPlanUpdateService { constructor(private readonly plans: AuditPlanService) {} update(user: RequestUser, id: string, dto: Record<string, any>) { return this.plans.update(user, id, dto); } }
