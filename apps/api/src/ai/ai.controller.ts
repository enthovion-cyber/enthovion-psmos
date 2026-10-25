import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { AiRateLimitGuard } from './ai-rate-limit.guard';
import { buildAiScope } from './ai-scope';
import { AiAuditService } from './ai-audit.service';
import { AiSettingsService, UpdateAiSettingsInput } from './ai-settings.service';
import { CopilotService } from './copilot.service';
import { DocumentAiService, IngestDocumentInput } from './document-ai.service';
import { KnowledgeGraphService, CreateRelationshipInput } from './knowledge-graph.service';
import { LlmGatewayService } from './llm-gateway.service';
import { calculateLopa, LopaInput } from './lopa-calculator';
import { ModuleAiService } from './module-ai.service';
import { MultimodalAiService } from './multimodal-ai.service';
import { PsmBenchmarkService } from './psm-benchmark.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard, AiRateLimitGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly copilot: CopilotService,
    private readonly llm: LlmGatewayService,
    private readonly audit: AiAuditService,
    private readonly settings: AiSettingsService,
    private readonly documentAi: DocumentAiService,
    private readonly moduleAi: ModuleAiService,
    private readonly graph: KnowledgeGraphService,
    private readonly multimodal: MultimodalAiService,
    private readonly benchmark: PsmBenchmarkService
  ) {}

  @Get('status')
  @Permissions('ai.copilot.use')
  async status(@CurrentUser() user: RequestUser) {
    const tenantSettings = await this.settings.getSettings(user.tenantId);
    return {
      aiEnabled: this.llm.enabled && tenantSettings.enabled,
      tenantEnabled: tenantSettings.enabled,
      systemConfigured: this.llm.enabled,
      fallback: 'extractive-search',
      model: this.llm.enabled ? this.llm.modelName : null,
      approvedModels: tenantSettings.approvedModels,
      provider: 'openai'
    };
  }

  @Get('settings')
  @Permissions('settings.manage')
  async getSettings(@CurrentUser() user: RequestUser) {
    return this.settings.getSettings(user.tenantId);
  }

  @Patch('settings')
  @Permissions('settings.manage')
  async updateSettings(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateAiSettingsInput
  ) {
    return this.settings.updateSettings(user, body);
  }

  @Get('audit-logs')
  @Permissions('audit.view')
  async getAuditLogs(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('kind') kind?: string
  ) {
    return this.settings.getAuditLogs(user.tenantId, {
      limit: limit ? parseInt(limit, 10) : 25,
      offset: offset ? parseInt(offset, 10) : 0,
      kind
    });
  }

  @Get('audit-logs/verify-chain')
  @Permissions('audit.view')
  async verifyAuditChain(@CurrentUser() user: RequestUser) {
    return this.audit.verifyChainIntegrity(user.tenantId);
  }

  @Get('audit-logs/export-checkpoint')
  @Permissions('audit.view')
  async exportAuditCheckpoint(@CurrentUser() user: RequestUser) {
    return this.audit.exportAuditCheckpoint(user.tenantId);
  }

  @Get('metrics/observability')
  @Permissions('audit.view')
  async getObservabilityMetrics(@CurrentUser() user: RequestUser) {
    return this.audit.getObservabilityMetrics(user.tenantId);
  }

  @Post('evaluation/run-benchmark')
  @Permissions('settings.manage')
  async runEvaluationBenchmark(@CurrentUser() user: RequestUser) {
    const result = this.benchmark.runBenchmark();
    await this.audit.record({
      tenantId: user.tenantId,
      siteId: user.activeSiteId ?? null,
      userId: user.id,
      kind: 'ai.evaluation.benchmark',
      model: this.llm.modelName,
      promptVersion: result.promptVersion,
      request: { benchmarkVersion: result.benchmarkVersion },
      response: {
        status: result.status,
        complianceRate: result.safetyComplianceRate,
        passedCases: result.passedCases
      }
    });
    return result;
  }

  @Post('copilot/ask')
  @Permissions('ai.copilot.use')
  async ask(
    @CurrentUser() user: RequestUser,
    @Body() body: { question?: string; contextModule?: string }
  ) {
    const question = (body?.question ?? '').trim().slice(0, 1500);
    if (!question) {
      return {
        answer: 'Question is required.',
        mode: 'no-evidence',
        sources: [],
        validation: null,
        uncertainties: []
      };
    }
    return this.copilot.ask(buildAiScope(user), question, body.contextModule);
  }

  @Post('documents/ingest')
  @Permissions('documents.create', 'documents.edit')
  async ingestDocument(
    @CurrentUser() user: RequestUser,
    @Body() body: IngestDocumentInput
  ) {
    return this.documentAi.ingestDocument(buildAiScope(user), body);
  }

  @Post('documents/compare')
  @Permissions('documents.view')
  async compareDocuments(
    @CurrentUser() user: RequestUser,
    @Body() body: {
      docA: { title: string; text: string; revision?: string };
      docB: { title: string; text: string; revision?: string };
    }
  ) {
    return this.documentAi.compareDocuments(buildAiScope(user), body.docA, body.docB);
  }

  @Post('tools/lopa')
  @Permissions('ai.copilot.use')
  async lopa(@CurrentUser() user: RequestUser, @Body() body: LopaInput) {
    const result = calculateLopa(body ?? {});
    await this.audit.record({
      tenantId: user.tenantId,
      siteId: user.activeSiteId ?? null,
      userId: user.id,
      kind: 'tool.lopa',
      request: body,
      response: result
    });
    return result;
  }

  // Phase 3: Module Contextual AI
  @Get('moc/:mocId/impact-analysis')
  @Permissions('moc.view')
  async analyzeMocImpact(
    @CurrentUser() user: RequestUser,
    @Param('mocId') mocId: string
  ) {
    return this.moduleAi.analyzeMocImpact(buildAiScope(user), mocId);
  }

  @Get('ptw/:permitId/safety-precheck')
  @Permissions('ptw.view')
  async precheckPermitSafety(
    @CurrentUser() user: RequestUser,
    @Param('permitId') permitId: string
  ) {
    return this.moduleAi.precheckPermitSafety(buildAiScope(user), permitId);
  }

  // Phase 4: Knowledge Graph & Barrier Health
  @Get('graph/trace')
  @Permissions('ai.copilot.use')
  async traceLineage(
    @CurrentUser() user: RequestUser,
    @Query('type') type: string,
    @Query('id') id: string,
    @Query('depth') depth?: string
  ) {
    return this.graph.traceLineage(
      buildAiScope(user),
      type || 'Equipment',
      id || 'root',
      depth ? parseInt(depth, 10) : 2
    );
  }

  @Post('graph/relationship')
  @Permissions('settings.manage')
  async createRelationship(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateRelationshipInput
  ) {
    return this.graph.createRelationship(buildAiScope(user), body);
  }

  @Patch('graph/relationship/:id/verify')
  @Permissions('settings.manage')
  async verifyRelationship(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { approve: boolean }
  ) {
    return this.graph.verifyRelationship(buildAiScope(user), id, Boolean(body?.approve));
  }

  @Get('barriers/health-summary')
  @Permissions('ai.copilot.use')
  async getBarrierHealthSummary(@CurrentUser() user: RequestUser) {
    return this.graph.getBarrierHealthSummary(buildAiScope(user));
  }

  // Phase 5: Multimodal & OT Telemetry
  @Post('multimodal/pid-extract')
  @Permissions('documents.view')
  async extractPID(
    @CurrentUser() user: RequestUser,
    @Body() body: { drawingNumber: string; revision: string; drawingOcrText: string }
  ) {
    return this.multimodal.extractPID(
      buildAiScope(user),
      body?.drawingNumber || 'P&ID-001',
      body?.revision || '1.0',
      body?.drawingOcrText || ''
    );
  }

  @Post('multimodal/field-observation')
  @Permissions('incidents.create')
  async draftFieldObservation(
    @CurrentUser() user: RequestUser,
    @Body() body: { audioTranscript?: string; photoNotes?: string; detectedTagHint?: string }
  ) {
    return this.multimodal.draftFieldObservation(buildAiScope(user), body);
  }

  @Get('multimodal/historian/telemetry')
  @Permissions('mechanical_integrity.view')
  async getHistorianTelemetry(@CurrentUser() user: RequestUser) {
    return this.multimodal.getHistorianTelemetry(buildAiScope(user));
  }

  @Post('multimodal/historian/evaluate-excursion')
  @Permissions('mechanical_integrity.view')
  async evaluateHistorianExcursion(
    @CurrentUser() user: RequestUser,
    @Body() body: { tag: string; currentValue: number }
  ) {
    return this.multimodal.evaluateHistorianExcursion(buildAiScope(user), body.tag, body.currentValue);
  }
}
