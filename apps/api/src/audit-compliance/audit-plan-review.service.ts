import { Injectable } from '@nestjs/common'; import { RequestUser } from '../common/decorators/current-user.decorator'; import { AuditPlanService } from './audit-plan.service';
@Injectable() export class AuditPlanReviewService { constructor(private readonly plans:AuditPlanService){} submit(user:RequestUser,id:string){return this.plans.transition(user,id,'submit-review');} }
