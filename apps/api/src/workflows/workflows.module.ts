import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ApprovalChainEngine } from './engines/approval-chain.engine';
import { ConditionRuleEngine } from './engines/condition-rule.engine';
import { EscalationEngine } from './engines/escalation.engine';
import { WorkflowRuntimeEngine } from './engines/workflow-runtime.engine';
import { WorkflowRepository } from './repositories/workflow.repository';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowRepository, ConditionRuleEngine, ApprovalChainEngine, WorkflowRuntimeEngine, EscalationEngine],
  exports: [WorkflowsService]
})
export class WorkflowsModule {}
