import { Injectable } from '@nestjs/common';
@Injectable() export class AuditPlanCalendarAdapterService { event(plan:Record<string,any>){return{id:plan.id,title:`${plan.plan_code} - ${plan.plan_title}`,start:plan.planned_start_at,end:plan.planned_end_at,timezone:plan.timezone,location:plan.audit_location,url:`/audit-compliance/plans/${plan.id}`};} }
