import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { TenantsModule } from '../tenants/tenants.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { GasTestReminderJob } from './jobs/gas-test-reminder.job';
import { PermitExpiryJob } from './jobs/permit-expiry.job';
import { ClosePermitPolicy } from './policies/close-permit.policy';
import { ExtendPermitPolicy } from './policies/extend-permit.policy';
import { IssuePermitPolicy } from './policies/issue-permit.policy';
import { PtwController } from './ptw.controller';
import { PtwService } from './ptw.service';
import { IsolationRepository } from './repositories/isolation.repository';
import { PermitRepository } from './repositories/permit.repository';
import { ClosureCompleteValidator } from './validators/closure-complete.validator';
import { GasLimitsValidator } from './validators/gas-limits.validator';
import { IsolationCompleteValidator } from './validators/isolation-complete.validator';
import { PermitConflictValidator } from './validators/permit-conflict.validator';

@Module({
  imports: [SupabaseModule, AuditModule, NotificationsModule, PermissionsModule, SearchModule, TenantsModule, WorkflowsModule, ActionsModule],
  controllers: [PtwController],
  providers: [
    PtwService,
    PermitRepository,
    IsolationRepository,
    GasLimitsValidator,
    PermitConflictValidator,
    IsolationCompleteValidator,
    ClosureCompleteValidator,
    IssuePermitPolicy,
    ClosePermitPolicy,
    ExtendPermitPolicy,
    PermitExpiryJob,
    GasTestReminderJob
  ],
  exports: [PtwService]
})
export class PtwModule {}
