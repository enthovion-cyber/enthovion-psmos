import { Injectable } from '@nestjs/common'; import { AuditPlanHistoryService } from './audit-plan-history.service';
@Injectable() export class AuditPlanAuditService { constructor(private readonly history:AuditPlanHistoryService){} write(input:Parameters<AuditPlanHistoryService['write']>[0]){return this.history.write(input);} }
