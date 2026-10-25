import { Module } from '@nestjs/common';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AiAuditService } from './ai-audit.service';
import { AiController } from './ai.controller';
import { AiRateLimitGuard } from './ai-rate-limit.guard';
import { AiSettingsService } from './ai-settings.service';
import { CopilotService } from './copilot.service';
import { DocumentAiService } from './document-ai.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { LlmGatewayService } from './llm-gateway.service';
import { ModuleAiService } from './module-ai.service';
import { MultimodalAiService } from './multimodal-ai.service';
import { PsmBenchmarkService } from './psm-benchmark.service';

@Module({
  imports: [SupabaseModule, PermissionsModule, TenantsModule],
  controllers: [AiController],
  providers: [
    AiAuditService,
    AiRateLimitGuard,
    AiSettingsService,
    CopilotService,
    DocumentAiService,
    KnowledgeGraphService,
    LlmGatewayService,
    ModuleAiService,
    MultimodalAiService,
    PsmBenchmarkService
  ],
  exports: [
    CopilotService,
    AiAuditService,
    AiRateLimitGuard,
    AiSettingsService,
    DocumentAiService,
    KnowledgeGraphService,
    LlmGatewayService,
    ModuleAiService,
    MultimodalAiService,
    PsmBenchmarkService
  ]
})
export class AiModule {}
