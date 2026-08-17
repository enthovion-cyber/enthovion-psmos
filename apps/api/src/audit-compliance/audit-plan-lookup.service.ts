import { Injectable } from '@nestjs/common'; import { AuditPlanService } from './audit-plan.service';
@Injectable() export class AuditPlanLookupService { constructor(private readonly plans:AuditPlanService){} all(){return this.plans.lookups();} }
