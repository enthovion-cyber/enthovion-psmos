import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SearchModule } from '../search/search.module';
import { HazopController } from './hazop.controller';
import { HazopService } from './hazop.service';
import { HazopDashboardService } from './hazop-dashboard.service';
import { HazopNumberingService } from './hazop-numbering.service';
import { HazopCreateService } from './hazop-create.service';
import { HazopLifecycleService } from './hazop-lifecycle.service';
import { HazopTeamService } from './hazop-team.service';
import { HazopNodeService } from './hazop-node.service';
import { HazopScenarioService } from './hazop-scenario.service';
import { HazopRiskService } from './hazop-risk.service';
import { HazopRecommendationService } from './hazop-recommendation.service';
import { HazopActionIntegrationService } from './hazop-action-integration.service';
import { HazopLopaTriggerService } from './hazop-lopa-trigger.service';
import { HazopLinkedRecordService } from './hazop-linked-record.service';
import { HazopHistoryService } from './hazop-history.service';
import { HazopAttachmentService } from './hazop-attachment.service';
import { HazopPermissionService } from './hazop-permission.service';
import { HazopSearchIndexService } from './hazop-search-index.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule, ActionsModule, SearchModule, NotificationsModule],
  controllers: [HazopController],
  providers: [
    HazopService,
    HazopDashboardService,
    HazopNumberingService,
    HazopCreateService,
    HazopLifecycleService,
    HazopTeamService,
    HazopNodeService,
    HazopScenarioService,
    HazopRiskService,
    HazopRecommendationService,
    HazopActionIntegrationService,
    HazopLopaTriggerService,
    HazopLinkedRecordService,
    HazopHistoryService,
    HazopAttachmentService,
    HazopPermissionService,
    HazopSearchIndexService
  ],
  exports: [HazopService]
})
export class HazopModule {}
