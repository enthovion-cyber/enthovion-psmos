import { Injectable } from '@nestjs/common';
@Injectable() export class AuditPlanReviewApprovalAdapterService { requestPayload(plan:Record<string,any>){return{module:'AUDIT_PLAN',recordId:plan.id,title:`Review ${plan.plan_code}`,reviewerUserId:plan.reviewer_user_id,status:'Pending Approval'};} }
