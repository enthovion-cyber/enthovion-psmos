import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { BulkLopaSessionAttendanceDto, CreateLopaActionDto, CreateLopaDto, CreateLopaFromHazopDto, LinkExistingLopaActionDto, LopaActionReasonDto, LopaAttachmentBulkDto, LopaAttachmentCommentDto, LopaAttachmentDocumentLinkDto, LopaAttachmentFilterDto, LopaEvidenceMappingDto, LopaFilterDto, LopaImpactedReceptorDto, LopaIplCandidateActionDto, LopaIplProofTestDto, LopaIplRegistryDocumentLinkDto, LopaIplRegistryEquipmentLinkDto, LopaIplRegistryFilterDto, LopaIplRegistryValidationDto, LopaIplsSafeguardsFilterDto, LopaIplValidationDto, LopaLibraryFilterDto, LopaLinkedRecordFilterDto, LopaManualFrequencyDto, LopaNoteDto, LopaRecommendationFilterDto, LopaRecommendationStatusDto, LopaRecommendationVerifyDto, LopaReviewCommentThreadDto, LopaReviewDecisionDto, LopaReviewExceptionDto, LopaReviewReminderDto, LopaReviewSignatureDto, LopaRiskCalculationActionDto, LopaRiskCalculationFilterDto, LopaSilActionDto, LopaSiteModifierDto, LopaStatusReasonDto, LopaTeamInviteDto, LopaTeamSessionsFilterDto, ReorderLopaSessionAgendaDto, ReplaceLopaTeamMemberDto, SaveLopaDraftDto, SelectConditionalModifierDto, SelectInitiatingEventLibraryDto, SelectLopaIplRegistryDto, UpdateLopaDto, UpdateLopaInitiatingEventDto, UpdateLopaScenarioConsequenceDto, UpsertConditionalModifierLibraryDto, UpsertInitiatingEventLibraryDto, UpsertLopaAttachmentDto, UpsertLopaIplCandidateDto, UpsertLopaIplRegistryDto, UpsertLopaLinkedRecordDto, UpsertLopaRecommendationDto, UpsertLopaReviewCommentDto, UpsertLopaReviewParticipantDto, UpsertLopaRiskCalculationAssumptionDto, UpsertLopaRiskCalculationGapDto, UpsertLopaSessionAgendaDto, UpsertLopaSessionAttendanceDto, UpsertLopaSessionDecisionDto, UpsertLopaSessionMinutesDto, UpsertLopaSessionDto, UpsertLopaStudySafeguardDto, UpsertLopaSifDto, UpsertLopaTeamMemberDto } from './dto/lopa.dto';
import { LopaService } from './lopa.service';
import { CreateLopaSilActionDto, UpsertLopaSifArchitectureDto, UpsertLopaSifComponentDto, UpsertLopaSifProofTestDto, UpsertLopaSilGapDto, UpsertLopaSilLinkDto } from './dto/lopa.dto';
import { LopaFinalReportFilterDto, LopaReportGenerateDto, LopaReportPackageDto, LopaReportPublishDto, LopaReportSectionsDto, LopaReportShareDto } from './dto/lopa.dto';

@ApiTags('lopa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('lopa')
export class LopaController {
  constructor(private readonly lopa: LopaService) {}

  @Get('summary')
  @Permissions(PermissionKeys.LOPADashboardView)
  summary(@CurrentUser() user: RequestUser) {
    return this.lopa.summary(user.tenantId, this.scope(user));
  }

  @Get('attention')
  @Permissions(PermissionKeys.LOPADashboardView)
  attention(@CurrentUser() user: RequestUser) {
    return this.lopa.attention(user.tenantId, this.scope(user));
  }

  @Get('context')
  @Permissions(PermissionKeys.LOPAView)
  context(@CurrentUser() user: RequestUser) {
    return this.lopa.context(user.tenantId, this.scope(user));
  }

  @Get('create/context')
  @Permissions(PermissionKeys.LOPACreate)
  createContext(@CurrentUser() user: RequestUser) {
    return this.lopa.createContext(user.tenantId, this.scope(user));
  }

  @Get('create/source-options')
  @Permissions(PermissionKeys.LOPACreate)
  createSourceOptions(@CurrentUser() user: RequestUser) {
    return this.lopa.sourceOptions(user.tenantId, this.scope(user));
  }

  @Get('create/hazop-required-scenarios')
  @Permissions(PermissionKeys.LOPAHazopScenariosView)
  createHazopRequired(@CurrentUser() user: RequestUser) {
    return this.lopa.hazopRequiredScenarios(user.tenantId, this.scope(user));
  }

  @Get('create/team-suggestions')
  @Permissions(PermissionKeys.LOPACreate)
  createTeamSuggestions(@CurrentUser() user: RequestUser, @Query() query: LopaTeamSessionsFilterDto & { hazopScenarioId?: string; siteId?: string; ownerId?: string; facilitatorId?: string }) {
    return this.lopa.createTeamSuggestions(user.tenantId, query, this.scope(user));
  }

  @Get('create/user-search')
  @Permissions(PermissionKeys.LOPACreate)
  createUserSearch(@CurrentUser() user: RequestUser, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.createUserSearch(user.tenantId, query, this.scope(user));
  }

  @Get('create/owner-profile/:ownerId')
  @Permissions(PermissionKeys.LOPACreate)
  createOwnerProfile(@CurrentUser() user: RequestUser, @Param('ownerId') ownerId: string, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.createOwnerProfile(user.tenantId, ownerId, query, this.scope(user));
  }

  @Get('hazop-required-scenarios')
  @Permissions(PermissionKeys.LOPAHazopScenariosView)
  hazopRequired(@CurrentUser() user: RequestUser) {
    return this.lopa.hazopRequiredScenarios(user.tenantId, this.scope(user));
  }

  @Get('hazop-required-scenarios/:scenarioId')
  @Permissions(PermissionKeys.LOPAHazopScenariosView)
  hazopRequiredDetail(@CurrentUser() user: RequestUser, @Param('scenarioId') scenarioId: string) {
    return this.lopa.hazopRequiredScenario(user.tenantId, scenarioId, this.scope(user));
  }

  @Get('libraries/context')
  @Permissions(PermissionKeys.LOPALibraryView)
  libraryContext(@CurrentUser() user: RequestUser) {
    return this.lopa.libraryContext(user.tenantId, this.scope(user));
  }

  @Get('libraries/initiating-events/summary')
  @Permissions(PermissionKeys.LOPAInitiatingEventLibraryView)
  initiatingEventSummary(@CurrentUser() user: RequestUser) {
    return this.lopa.initiatingEventLibrarySummary(user.tenantId, this.scope(user));
  }

  @Get('libraries/initiating-events/search')
  @Permissions(PermissionKeys.LOPAInitiatingEventLibraryView)
  initiatingEventSearch(@CurrentUser() user: RequestUser, @Query() query: LopaLibraryFilterDto) {
    return this.lopa.initiatingEventLibrarySearch(user.tenantId, query, this.scope(user));
  }

  @Get('libraries/initiating-events')
  @Permissions(PermissionKeys.LOPAInitiatingEventLibraryView)
  initiatingEventList(@CurrentUser() user: RequestUser, @Query() query: LopaLibraryFilterDto) {
    return this.lopa.initiatingEventLibraryList(user.tenantId, query, this.scope(user));
  }

  @Get('libraries/initiating-events/:libraryId')
  @Permissions(PermissionKeys.LOPAInitiatingEventLibraryView)
  initiatingEventDetail(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string) {
    return this.lopa.initiatingEventLibraryDetail(user.tenantId, libraryId, this.scope(user));
  }

  @Post('libraries/initiating-events')
  @Permissions(PermissionKeys.LOPALibraryCreate)
  createInitiatingEvent(@CurrentUser() user: RequestUser, @Body() dto: UpsertInitiatingEventLibraryDto) {
    return this.lopa.createInitiatingEventLibrary(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('libraries/initiating-events/:libraryId')
  @Permissions(PermissionKeys.LOPALibraryEdit)
  updateInitiatingEventLibraryRecord(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: UpsertInitiatingEventLibraryDto) {
    return this.lopa.updateInitiatingEventLibrary(user.tenantId, user.id, libraryId, dto, this.scope(user));
  }

  @Post('libraries/initiating-events/:libraryId/submit-review')
  @Permissions(PermissionKeys.LOPALibrarySubmitReview)
  submitInitiatingEvent(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'initiating', libraryId, 'Pending Review', this.scope(user));
  }

  @Post('libraries/initiating-events/:libraryId/approve')
  @Permissions(PermissionKeys.LOPALibraryApprove)
  approveInitiatingEvent(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'initiating', libraryId, 'Approved', this.scope(user));
  }

  @Post('libraries/initiating-events/:libraryId/reject')
  @Permissions(PermissionKeys.LOPALibraryReject)
  rejectInitiatingEvent(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'initiating', libraryId, 'Rejected', this.scope(user), dto.reason);
  }

  @Post('libraries/initiating-events/:libraryId/create-revision')
  @Permissions(PermissionKeys.LOPALibraryRevisionCreate)
  reviseInitiatingEvent(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.createLibraryRevision(user.tenantId, user.id, 'initiating', libraryId, this.scope(user), dto.reason);
  }

  @Post('libraries/initiating-events/:libraryId/archive')
  @Permissions(PermissionKeys.LOPALibraryArchive)
  archiveInitiatingEvent(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'initiating', libraryId, 'Archived', this.scope(user), dto.reason);
  }

  @Get('libraries/conditional-modifiers/summary')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryView)
  modifierSummary(@CurrentUser() user: RequestUser) {
    return this.lopa.conditionalModifierLibrarySummary(user.tenantId, this.scope(user));
  }

  @Get('libraries/conditional-modifiers/search')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryView)
  modifierSearch(@CurrentUser() user: RequestUser, @Query() query: LopaLibraryFilterDto) {
    return this.lopa.conditionalModifierLibrarySearch(user.tenantId, query, this.scope(user));
  }

  @Get('libraries/conditional-modifiers')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryView)
  modifierList(@CurrentUser() user: RequestUser, @Query() query: LopaLibraryFilterDto) {
    return this.lopa.conditionalModifierLibraryList(user.tenantId, query, this.scope(user));
  }

  @Get('libraries/conditional-modifiers/:libraryId')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryView)
  modifierDetail(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string) {
    return this.lopa.conditionalModifierLibraryDetail(user.tenantId, libraryId, this.scope(user));
  }

  @Post('libraries/conditional-modifiers')
  @Permissions(PermissionKeys.LOPALibraryCreate)
  createModifier(@CurrentUser() user: RequestUser, @Body() dto: UpsertConditionalModifierLibraryDto) {
    return this.lopa.createConditionalModifierLibrary(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('libraries/conditional-modifiers/:libraryId')
  @Permissions(PermissionKeys.LOPALibraryEdit)
  updateModifier(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: UpsertConditionalModifierLibraryDto) {
    return this.lopa.updateConditionalModifierLibrary(user.tenantId, user.id, libraryId, dto, this.scope(user));
  }

  @Post('libraries/conditional-modifiers/:libraryId/submit-review')
  @Permissions(PermissionKeys.LOPALibrarySubmitReview)
  submitModifier(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'modifier', libraryId, 'Pending Review', this.scope(user));
  }

  @Post('libraries/conditional-modifiers/:libraryId/approve')
  @Permissions(PermissionKeys.LOPALibraryApprove)
  approveModifier(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'modifier', libraryId, 'Approved', this.scope(user));
  }

  @Post('libraries/conditional-modifiers/:libraryId/reject')
  @Permissions(PermissionKeys.LOPALibraryReject)
  rejectModifier(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'modifier', libraryId, 'Rejected', this.scope(user), dto.reason);
  }

  @Post('libraries/conditional-modifiers/:libraryId/create-revision')
  @Permissions(PermissionKeys.LOPALibraryRevisionCreate)
  reviseModifier(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.createLibraryRevision(user.tenantId, user.id, 'modifier', libraryId, this.scope(user), dto.reason);
  }

  @Post('libraries/conditional-modifiers/:libraryId/archive')
  @Permissions(PermissionKeys.LOPALibraryArchive)
  archiveModifier(@CurrentUser() user: RequestUser, @Param('libraryId') libraryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.transitionLibraryRecord(user.tenantId, user.id, 'modifier', libraryId, 'Archived', this.scope(user), dto.reason);
  }

  @Get('ipl-registry/context')
  @Permissions(PermissionKeys.LOPAIplRegistryView)
  iplRegistryContext(@CurrentUser() user: RequestUser) {
    return this.lopa.iplRegistryContext(user.tenantId, this.scope(user));
  }

  @Get('ipl-registry/summary')
  @Permissions(PermissionKeys.LOPAIplRegistryView)
  iplRegistrySummary(@CurrentUser() user: RequestUser) {
    return this.lopa.iplRegistrySummary(user.tenantId, this.scope(user));
  }

  @Get('ipl-registry/search')
  @Permissions(PermissionKeys.LOPAIplRegistryView)
  iplRegistrySearch(@CurrentUser() user: RequestUser, @Query() query: LopaIplRegistryFilterDto) {
    return this.lopa.iplRegistrySearch(user.tenantId, query, this.scope(user));
  }

  @Get('ipl-registry/export')
  @Permissions(PermissionKeys.LOPAIplRegistryExport)
  exportIplRegistry(@CurrentUser() user: RequestUser, @Query() query: LopaIplRegistryFilterDto) {
    return this.lopa.exportIplRegistry(user.tenantId, query, this.scope(user));
  }

  @Get('ipl-registry')
  @Permissions(PermissionKeys.LOPAIplRegistryView)
  iplRegistryList(@CurrentUser() user: RequestUser, @Query() query: LopaIplRegistryFilterDto) {
    return this.lopa.iplRegistryList(user.tenantId, query, this.scope(user));
  }

  @Post('ipl-registry')
  @Permissions(PermissionKeys.LOPAIplRegistryCreate)
  createIplRegistry(@CurrentUser() user: RequestUser, @Body() dto: UpsertLopaIplRegistryDto) {
    return this.lopa.createIplRegistry(user.tenantId, user.id, dto, this.scope(user));
  }

  @Get('ipl-registry/:registryId')
  @Permissions(PermissionKeys.LOPAIplRegistryView)
  iplRegistryDetail(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string) {
    return this.lopa.iplRegistryDetail(user.tenantId, registryId, this.scope(user));
  }

  @Patch('ipl-registry/:registryId')
  @Permissions(PermissionKeys.LOPAIplRegistryEdit)
  updateIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: UpsertLopaIplRegistryDto) {
    return this.lopa.updateIplRegistry(user.tenantId, user.id, registryId, dto, this.scope(user));
  }

  @Post('ipl-registry/:registryId/submit-review')
  @Permissions(PermissionKeys.LOPAIplRegistrySubmitReview)
  submitIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string) {
    return this.lopa.transitionIplRegistry(user.tenantId, user.id, registryId, 'Pending Review', this.scope(user));
  }

  @Post('ipl-registry/:registryId/approve')
  @Permissions(PermissionKeys.LOPAIplRegistryApprove)
  approveIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.transitionIplRegistry(user.tenantId, user.id, registryId, 'Approved', this.scope(user), dto.reason);
  }

  @Post('ipl-registry/:registryId/reject')
  @Permissions(PermissionKeys.LOPAIplRegistryReject)
  rejectIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.transitionIplRegistry(user.tenantId, user.id, registryId, 'Rejected', this.scope(user), dto.reason);
  }

  @Post('ipl-registry/:registryId/create-revision')
  @Permissions(PermissionKeys.LOPAIplRegistryRevisionCreate)
  reviseIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.createIplRegistryRevision(user.tenantId, user.id, registryId, this.scope(user), dto.reason);
  }

  @Post('ipl-registry/:registryId/archive')
  @Permissions(PermissionKeys.LOPAIplRegistryArchive)
  archiveIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.archiveIplRegistry(user.tenantId, user.id, registryId, this.scope(user), dto.reason);
  }

  @Post('ipl-registry/:registryId/restore')
  @Permissions(PermissionKeys.LOPAIplRegistryRestore)
  restoreIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.restoreIplRegistry(user.tenantId, user.id, registryId, this.scope(user), dto.reason);
  }

  @Post('ipl-registry/:registryId/duplicate')
  @Permissions(PermissionKeys.LOPAIplRegistryCreate)
  duplicateIplRegistry(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.duplicateIplRegistry(user.tenantId, user.id, registryId, this.scope(user), dto.reason);
  }

  @Get('ipl-registry/:registryId/validation')
  @Permissions(PermissionKeys.LOPAIplRegistryView)
  iplRegistryValidation(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string) {
    return this.lopa.iplRegistryValidation(user.tenantId, registryId, this.scope(user));
  }

  @Patch('ipl-registry/:registryId/validation')
  @Permissions(PermissionKeys.LOPAIplRegistryValidationManage)
  updateIplRegistryValidation(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaIplRegistryValidationDto) {
    return this.lopa.updateIplRegistryValidation(user.tenantId, user.id, registryId, dto, this.scope(user));
  }

  @Post('ipl-registry/:registryId/equipment-links')
  @Permissions(PermissionKeys.LOPAIplRegistryLinksManage)
  addIplRegistryEquipmentLink(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaIplRegistryEquipmentLinkDto) {
    return this.lopa.addIplRegistryEquipmentLink(user.tenantId, user.id, registryId, dto, this.scope(user));
  }

  @Delete('ipl-registry/:registryId/equipment-links/:linkId')
  @Permissions(PermissionKeys.LOPAIplRegistryLinksManage)
  deleteIplRegistryEquipmentLink(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Param('linkId') linkId: string) {
    return this.lopa.deleteIplRegistryLink(user.tenantId, user.id, registryId, linkId, 'equipment', this.scope(user));
  }

  @Post('ipl-registry/:registryId/document-links')
  @Permissions(PermissionKeys.LOPAIplRegistryLinksManage)
  addIplRegistryDocumentLink(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Body() dto: LopaIplRegistryDocumentLinkDto) {
    return this.lopa.addIplRegistryDocumentLink(user.tenantId, user.id, registryId, dto, this.scope(user));
  }

  @Delete('ipl-registry/:registryId/document-links/:linkId')
  @Permissions(PermissionKeys.LOPAIplRegistryLinksManage)
  deleteIplRegistryDocumentLink(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string, @Param('linkId') linkId: string) {
    return this.lopa.deleteIplRegistryLink(user.tenantId, user.id, registryId, linkId, 'document', this.scope(user));
  }

  @Get('ipl-registry/:registryId/history')
  @Permissions(PermissionKeys.LOPAIplRegistryHistoryView)
  iplRegistryHistory(@CurrentUser() user: RequestUser, @Param('registryId') registryId: string) {
    return this.lopa.iplRegistryHistory(user.tenantId, registryId, this.scope(user));
  }

  @Get()
  @Permissions(PermissionKeys.LOPAView)
  list(@CurrentUser() user: RequestUser, @Query() query: LopaFilterDto) {
    return this.lopa.list(user.tenantId, query, this.scope(user));
  }

  @Post()
  @Permissions(PermissionKeys.LOPACreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateLopaDto) {
    return this.lopa.create(user.tenantId, user.id, dto, this.scope(user));
  }

  @Post('save-draft')
  @Permissions(PermissionKeys.LOPACreate)
  saveDraft(@CurrentUser() user: RequestUser, @Body() dto: SaveLopaDraftDto) {
    return this.lopa.saveDraft(user.tenantId, user.id, dto, this.scope(user));
  }

  @Post('from-hazop/:hazopScenarioId')
  @Permissions(PermissionKeys.LOPACreateFromHazop)
  fromHazop(@CurrentUser() user: RequestUser, @Param('hazopScenarioId') scenarioId: string, @Body() dto: CreateLopaFromHazopDto) {
    return this.lopa.createFromHazop(user.tenantId, user.id, scenarioId, dto, this.scope(user));
  }

  @Get(':id/review-signoff') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewSignoff(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewSignoffTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/review-signoff/summary') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewSummary(user.tenantId, id, this.scope(user)); }

  @Get(':id/review-signoff/readiness') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewReadiness(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/refresh-readiness') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  refreshReviewReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.refreshReviewReadiness(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/review-signoff/workflow') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewWorkflow(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/submit') @Permissions(PermissionKeys.LOPAReviewSignoffSubmit)
  submitReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.submitReview(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/review-signoff/withdraw') @Permissions(PermissionKeys.LOPAReviewSignoffWithdraw)
  withdrawReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.withdrawReview(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/review-signoff/request-changes') @Permissions(PermissionKeys.LOPAReviewSignoffRequestChanges)
  requestReviewChanges(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.requestReviewChanges(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/review-signoff/approve') @Permissions(PermissionKeys.LOPAReviewSignoffApprove)
  approveReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.approveReview(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/review-signoff/reject') @Permissions(PermissionKeys.LOPAReviewSignoffReject)
  rejectReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.rejectReview(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/review-signoff/reopen') @Permissions(PermissionKeys.LOPAReviewSignoffReopen)
  reopenReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.reopenReview(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/review-signoff/participants') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewParticipants(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewParticipants(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/participants') @Permissions(PermissionKeys.LOPAReviewParticipantsManage)
  addReviewParticipant(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaReviewParticipantDto) { return this.lopa.addReviewParticipant(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/review-signoff/participants/:participantId') @Permissions(PermissionKeys.LOPAReviewParticipantsManage)
  updateReviewParticipant(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('participantId') participantId: string, @Body() dto: UpsertLopaReviewParticipantDto) { return this.lopa.updateReviewParticipant(user.tenantId, user.id, id, participantId, dto, this.scope(user)); }

  @Delete(':id/review-signoff/participants/:participantId') @Permissions(PermissionKeys.LOPAReviewParticipantsManage)
  removeReviewParticipant(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('participantId') participantId: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.removeReviewParticipant(user.tenantId, user.id, id, participantId, dto.reason ?? '', this.scope(user)); }

  @Post(':id/review-signoff/participants/:participantId/decision') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  decideReviewParticipant(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('participantId') participantId: string, @Body() dto: LopaReviewDecisionDto & { decision?: string }) { return this.lopa.decideReviewParticipant(user.tenantId, user.id, id, participantId, dto, this.scope(user)); }

  @Post(':id/review-signoff/participants/:participantId/send-reminder') @Permissions(PermissionKeys.LOPAReviewNotificationsSend)
  sendParticipantReminder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('participantId') participantId: string, @Body() dto: LopaReviewReminderDto) { return this.lopa.sendReviewReminders(user.tenantId, user.id, id, { ...dto, participantId }, this.scope(user)); }

  @Get(':id/review-signoff/comments') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewComments(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewComments(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/comments') @Permissions(PermissionKeys.LOPAReviewCommentsCreate)
  addReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaReviewCommentDto) { return this.lopa.addReviewComment(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/review-signoff/comments/:commentId') @Permissions(PermissionKeys.LOPAReviewCommentsEdit)
  updateReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: UpsertLopaReviewCommentDto) { return this.lopa.updateReviewComment(user.tenantId, user.id, id, commentId, dto, this.scope(user)); }

  @Post(':id/review-signoff/comments/:commentId/resolve') @Permissions(PermissionKeys.LOPAReviewCommentsResolve)
  resolveReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.resolveReviewComment(user.tenantId, user.id, id, commentId, dto, this.scope(user)); }

  @Post(':id/review-signoff/comments/:commentId/reopen') @Permissions(PermissionKeys.LOPAReviewCommentsReopen)
  reopenReviewComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: LopaReviewDecisionDto) { return this.lopa.reopenReviewComment(user.tenantId, user.id, id, commentId, dto, this.scope(user)); }

  @Get(':id/review-signoff/comments/:commentId/thread') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewCommentThread(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string) { return this.lopa.reviewCommentThread(user.tenantId, id, commentId, this.scope(user)); }

  @Post(':id/review-signoff/comments/:commentId/thread') @Permissions(PermissionKeys.LOPAReviewCommentsEdit)
  addReviewCommentThread(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('commentId') commentId: string, @Body() dto: LopaReviewCommentThreadDto) { return this.lopa.addReviewCommentThread(user.tenantId, user.id, id, commentId, dto, this.scope(user)); }

  @Get(':id/review-signoff/signatures') @Permissions(PermissionKeys.LOPAReviewSignaturesView)
  reviewSignatures(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewSignatures(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/signatures/request') @Permissions(PermissionKeys.LOPAReviewSignaturesRequest)
  requestReviewSignature(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewReminderDto) { if (!dto.participantId) throw new BadRequestException('participantId is required'); return this.lopa.requestReviewSignature(user.tenantId, user.id, id, dto.participantId, this.scope(user)); }

  @Post(':id/review-signoff/signatures/sign') @Permissions(PermissionKeys.LOPAReviewSignaturesSign)
  signReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewSignatureDto) { return this.lopa.signReview(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/review-signoff/snapshots') @Permissions(PermissionKeys.LOPAApprovalSnapshotsView)
  reviewSnapshots(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewSnapshots(user.tenantId, id, this.scope(user)); }

  @Get(':id/review-signoff/snapshots/:snapshotId') @Permissions(PermissionKeys.LOPAApprovalSnapshotsView)
  reviewSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('snapshotId') snapshotId: string) { return this.lopa.reviewSnapshot(user.tenantId, id, snapshotId, this.scope(user)); }

  @Get(':id/review-signoff/blockers') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewBlockers(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/blockers/:blockerId/accept-exception') @Permissions(PermissionKeys.LOPAReviewSignoffOverrideBlockers)
  acceptReviewBlockerException(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('blockerId') blockerId: string, @Body() dto: LopaReviewExceptionDto) { return this.lopa.acceptReviewBlockerException(user.tenantId, user.id, id, blockerId, dto, this.scope(user)); }

  @Get(':id/review-signoff/notifications') @Permissions(PermissionKeys.LOPAReviewSignoffView)
  reviewNotifications(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.reviewNotifications(user.tenantId, id, this.scope(user)); }

  @Post(':id/review-signoff/send-reminders') @Permissions(PermissionKeys.LOPAReviewNotificationsSend)
  sendReviewReminders(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReviewReminderDto) { return this.lopa.sendReviewReminders(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/overview')
  @Permissions(PermissionKeys.LOPAOverviewView)
  overview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.overview(user.tenantId, id, this.scope(user));
  }

  @Get(':id/readiness')
  @Permissions(PermissionKeys.LOPAReadinessView)
  readiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.readiness(user.tenantId, id, this.scope(user));
  }

  @Get(':id/blockers')
  @Permissions(PermissionKeys.LOPABlockersView)
  blockers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.blockers(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recent-activity')
  @Permissions(PermissionKeys.LOPAHistoryView)
  recentActivity(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.recentActivity(user.tenantId, id, this.scope(user));
  }

  @Get(':id/source-snapshot')
  @Permissions(PermissionKeys.LOPASourceSnapshotView)
  sourceSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.sourceSnapshot(user.tenantId, id, this.scope(user));
  }

  @Patch(':id')
  @Permissions(PermissionKeys.LOPAEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateLopaDto) {
    return this.lopa.update(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/cancel')
  @Permissions(PermissionKeys.LOPACancel)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.cancel(user.tenantId, user.id, id, dto.reason ?? '', this.scope(user));
  }

  @Post(':id/reopen')
  @Permissions(PermissionKeys.LOPAReopen)
  reopen(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaStatusReasonDto) {
    return this.lopa.reopen(user.tenantId, user.id, id, dto.reason ?? '', this.scope(user));
  }

  @Post(':id/sync-hazop-source')
  @Permissions(PermissionKeys.LOPASourceSync)
  syncHazopSource(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.syncHazopSource(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/scenario-consequence/context')
  @Permissions(PermissionKeys.LOPAScenarioView)
  scenarioContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.scenarioConsequenceContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/scenario-consequence')
  @Permissions(PermissionKeys.LOPAScenarioView)
  scenarioConsequence(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.scenarioConsequence(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/scenario-consequence')
  @Permissions(PermissionKeys.LOPAScenarioEdit, PermissionKeys.LOPAConsequenceEdit)
  updateScenarioConsequence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateLopaScenarioConsequenceDto) {
    return this.lopa.updateScenarioConsequence(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/scenario-consequence/sync-hazop')
  @Permissions(PermissionKeys.LOPAScenarioSyncHazop)
  syncScenarioHazop(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.syncScenarioFromHazop(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/scenario-consequence/source-comparison')
  @Permissions(PermissionKeys.LOPAScenarioView)
  scenarioSourceComparison(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.scenarioSourceComparison(user.tenantId, id, this.scope(user));
  }

  @Get(':id/scenario-consequence/readiness')
  @Permissions(PermissionKeys.LOPAScenarioView)
  scenarioReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.scenarioReadiness(user.tenantId, id, this.scope(user));
  }

  @Post(':id/scenario-consequence/mark-complete')
  @Permissions(PermissionKeys.LOPAScenarioMarkComplete)
  markScenarioComplete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.markScenarioConsequenceComplete(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/impacted-receptors')
  @Permissions(PermissionKeys.LOPAConsequenceView)
  receptors(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.impactedReceptors(user.tenantId, id, this.scope(user));
  }

  @Post(':id/impacted-receptors')
  @Permissions(PermissionKeys.LOPAReceptorsManage)
  createReceptor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaImpactedReceptorDto) {
    return this.lopa.createImpactedReceptor(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/impacted-receptors/:receptorId')
  @Permissions(PermissionKeys.LOPAReceptorsManage)
  updateReceptor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('receptorId') receptorId: string, @Body() dto: LopaImpactedReceptorDto) {
    return this.lopa.updateImpactedReceptor(user.tenantId, user.id, id, receptorId, dto, this.scope(user));
  }

  @Delete(':id/impacted-receptors/:receptorId')
  @Permissions(PermissionKeys.LOPAReceptorsManage)
  deleteReceptor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('receptorId') receptorId: string) {
    return this.lopa.deleteImpactedReceptor(user.tenantId, user.id, id, receptorId, this.scope(user));
  }

  @Get(':id/scenario-notes')
  @Permissions(PermissionKeys.LOPAScenarioView)
  scenarioNotes(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.scenarioNotes(user.tenantId, id, this.scope(user));
  }

  @Post(':id/scenario-notes')
  @Permissions(PermissionKeys.LOPAScenarioNotesManage)
  createScenarioNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaNoteDto) {
    return this.lopa.createScenarioNote(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/scenario-notes/:noteId')
  @Permissions(PermissionKeys.LOPAScenarioNotesManage)
  updateScenarioNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('noteId') noteId: string, @Body() dto: LopaNoteDto) {
    return this.lopa.updateScenarioNote(user.tenantId, user.id, id, noteId, dto, this.scope(user));
  }

  @Delete(':id/scenario-notes/:noteId')
  @Permissions(PermissionKeys.LOPAScenarioNotesManage)
  deleteScenarioNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('noteId') noteId: string) {
    return this.lopa.deleteScenarioNote(user.tenantId, user.id, id, noteId, this.scope(user));
  }

  @Get(':id/initiating-event/context')
  @Permissions(PermissionKeys.LOPAInitiatingEventView)
  initiatingEventContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.initiatingEventContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/initiating-event')
  @Permissions(PermissionKeys.LOPAInitiatingEventView)
  initiatingEvent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.initiatingEventTab(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/initiating-event')
  @Permissions(PermissionKeys.LOPAInitiatingEventEdit)
  updateInitiatingEventTab(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateLopaInitiatingEventDto) {
    return this.lopa.updateInitiatingEventTab(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/initiating-event/manual-frequency')
  @Permissions(PermissionKeys.LOPAManualFrequencyEntry)
  manualFrequency(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaManualFrequencyDto) {
    return this.lopa.saveManualFrequency(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/initiating-event/site-modifier')
  @Permissions(PermissionKeys.LOPASiteModifierApply)
  siteModifier(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaSiteModifierDto) {
    return this.lopa.saveSiteModifier(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/initiating-event/readiness')
  @Permissions(PermissionKeys.LOPAInitiatingEventView)
  initiatingEventReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.initiatingEventReadiness(user.tenantId, id, this.scope(user));
  }

  @Post(':id/initiating-event/mark-complete')
  @Permissions(PermissionKeys.LOPAInitiatingEventMarkComplete)
  markInitiatingEventComplete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.markInitiatingEventComplete(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/initiating-event/frequency-snapshot')
  @Permissions(PermissionKeys.LOPAInitiatingEventView)
  frequencySnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.frequencySnapshot(user.tenantId, id, this.scope(user));
  }

  @Get(':id/initiating-event-notes')
  @Permissions(PermissionKeys.LOPAInitiatingEventView)
  initiatingEventNotes(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.initiatingEventNotes(user.tenantId, id, this.scope(user));
  }

  @Post(':id/initiating-event-notes')
  @Permissions(PermissionKeys.LOPAInitiatingEventNotesManage)
  createInitiatingEventNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaNoteDto) {
    return this.lopa.createInitiatingEventNote(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/initiating-event-notes/:noteId')
  @Permissions(PermissionKeys.LOPAInitiatingEventNotesManage)
  updateInitiatingEventNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('noteId') noteId: string, @Body() dto: LopaNoteDto) {
    return this.lopa.updateInitiatingEventNote(user.tenantId, user.id, id, noteId, dto, this.scope(user));
  }

  @Delete(':id/initiating-event-notes/:noteId')
  @Permissions(PermissionKeys.LOPAInitiatingEventNotesManage)
  deleteInitiatingEventNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('noteId') noteId: string) {
    return this.lopa.deleteInitiatingEventNote(user.tenantId, user.id, id, noteId, this.scope(user));
  }

  @Post(':id/initiating-event/select-from-library')
  @Permissions(PermissionKeys.LOPAInitiatingEventLibrarySelect)
  selectInitiatingEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SelectInitiatingEventLibraryDto) {
    return this.lopa.selectInitiatingEventFromLibrary(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/conditional-modifiers')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryView)
  studyModifiers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.studyConditionalModifierSnapshots(user.tenantId, id, this.scope(user));
  }

  @Post(':id/conditional-modifiers/select')
  @Permissions(PermissionKeys.LOPAConditionalModifierSelect)
  selectModifier(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SelectConditionalModifierDto) {
    return this.lopa.selectConditionalModifier(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/conditional-modifiers/:snapshotId')
  @Permissions(PermissionKeys.LOPAConditionalModifierOverride)
  updateModifierSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('snapshotId') snapshotId: string, @Body() dto: SelectConditionalModifierDto) {
    return this.lopa.updateConditionalModifierSnapshot(user.tenantId, user.id, id, snapshotId, dto, this.scope(user));
  }

  @Post(':id/conditional-modifiers/:snapshotId/archive')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryUse)
  removeModifierSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('snapshotId') snapshotId: string) {
    return this.lopa.archiveConditionalModifierSnapshot(user.tenantId, user.id, id, snapshotId, this.scope(user));
  }

  @Delete(':id/conditional-modifiers/:snapshotId')
  @Permissions(PermissionKeys.LOPAConditionalModifierLibraryUse)
  deleteModifierSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('snapshotId') snapshotId: string) {
    return this.lopa.archiveConditionalModifierSnapshot(user.tenantId, user.id, id, snapshotId, this.scope(user));
  }

  @Get(':id/ipls-safeguards/context')
  @Permissions(PermissionKeys.LOPAIplView)
  iplsSafeguardsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.iplsSafeguardsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/ipls-safeguards/available-registry')
  @Permissions(PermissionKeys.LOPAIplRegistrySelect)
  availableIplRegistry(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaIplRegistryFilterDto) {
    return this.lopa.availableIplRegistry(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/ipls-safeguards/summary')
  @Permissions(PermissionKeys.LOPAIplView)
  iplsSafeguardsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.iplsSafeguardsSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/ipls-safeguards/readiness')
  @Permissions(PermissionKeys.LOPAIplReadinessView)
  iplsSafeguardsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.iplsSafeguardsReadiness(user.tenantId, id, this.scope(user));
  }

  @Get(':id/ipls-safeguards/gaps')
  @Permissions(PermissionKeys.LOPAIplReadinessView)
  iplsSafeguardsGaps(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.iplsSafeguardsGaps(user.tenantId, id, this.scope(user));
  }

  @Get(':id/ipls-safeguards')
  @Permissions(PermissionKeys.LOPAIplView)
  iplsSafeguards(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaIplsSafeguardsFilterDto) {
    return this.lopa.iplsSafeguardsTab(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/safeguards/import-hazop')
  @Permissions(PermissionKeys.LOPAIplImportHazopSafeguards)
  importHazopSafeguards(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.importHazopSafeguards(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/safeguards')
  @Permissions(PermissionKeys.LOPAIplSafeguardCreate)
  createStudySafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaStudySafeguardDto) {
    return this.lopa.createStudySafeguard(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/safeguards/:safeguardId')
  @Permissions(PermissionKeys.LOPAIplSafeguardEdit)
  updateStudySafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: UpsertLopaStudySafeguardDto) {
    return this.lopa.updateStudySafeguard(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Delete(':id/safeguards/:safeguardId')
  @Permissions(PermissionKeys.LOPAIplSafeguardDelete)
  deleteStudySafeguard(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string) {
    return this.lopa.deleteStudySafeguard(user.tenantId, user.id, id, safeguardId, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/mark-ipl-candidate')
  @Permissions(PermissionKeys.LOPAIplUpgradeSafeguard)
  markSafeguardIplCandidate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: UpsertLopaIplCandidateDto) {
    return this.lopa.markSafeguardIplCandidate(user.tenantId, user.id, id, safeguardId, dto, this.scope(user));
  }

  @Post(':id/safeguards/:safeguardId/reject-ipl')
  @Permissions(PermissionKeys.LOPAIplReject)
  rejectSafeguardIpl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('safeguardId') safeguardId: string, @Body() dto: LopaIplCandidateActionDto) {
    return this.lopa.rejectSafeguardIpl(user.tenantId, user.id, id, safeguardId, dto.reason, this.scope(user));
  }

  @Get(':id/ipl-candidates')
  @Permissions(PermissionKeys.LOPAIplView)
  iplCandidates(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaIplsSafeguardsFilterDto) {
    return this.lopa.iplCandidates(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/ipl-candidates')
  @Permissions(PermissionKeys.LOPAIplCandidateCreate)
  createIplCandidate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaIplCandidateDto) {
    return this.lopa.createIplCandidate(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/ipl-candidates/select-from-registry')
  @Permissions(PermissionKeys.LOPAIplRegistrySelect)
  selectIplFromRegistry(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: SelectLopaIplRegistryDto) {
    return this.lopa.selectIplFromRegistry(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/ipl-candidates/:candidateId')
  @Permissions(PermissionKeys.LOPAIplView)
  iplCandidateDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string) {
    return this.lopa.iplCandidateDetail(user.tenantId, id, candidateId, this.scope(user));
  }

  @Patch(':id/ipl-candidates/:candidateId')
  @Permissions(PermissionKeys.LOPAIplCandidateEdit)
  updateIplCandidate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: UpsertLopaIplCandidateDto) {
    return this.lopa.updateIplCandidate(user.tenantId, user.id, id, candidateId, dto, this.scope(user));
  }

  @Delete(':id/ipl-candidates/:candidateId')
  @Permissions(PermissionKeys.LOPAIplCandidateDelete)
  deleteIplCandidate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string) {
    return this.lopa.deleteIplCandidate(user.tenantId, user.id, id, candidateId, this.scope(user));
  }

  @Get(':id/ipl-candidates/:candidateId/validation')
  @Permissions(PermissionKeys.LOPAIplView)
  iplCandidateValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string) {
    return this.lopa.iplCandidateValidation(user.tenantId, id, candidateId, this.scope(user));
  }

  @Patch(':id/ipl-candidates/:candidateId/validation')
  @Permissions(PermissionKeys.LOPAIplValidate)
  updateIplCandidateValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: LopaIplValidationDto) {
    return this.lopa.updateIplCandidateValidation(user.tenantId, user.id, id, candidateId, dto, this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/start-validation')
  @Permissions(PermissionKeys.LOPAIplValidate)
  startIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string) {
    return this.lopa.setIplCandidateValidationStatus(user.tenantId, user.id, id, candidateId, 'In Review', this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/submit-validation')
  @Permissions(PermissionKeys.LOPAIplValidate)
  submitIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string) {
    return this.lopa.setIplCandidateValidationStatus(user.tenantId, user.id, id, candidateId, 'Validation Complete', this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/approve-credit')
  @Permissions(PermissionKeys.LOPAIplCredit)
  approveIplCredit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: LopaIplCandidateActionDto) {
    return this.lopa.approveIplCredit(user.tenantId, user.id, id, candidateId, dto, this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/remove-credit')
  @Permissions(PermissionKeys.LOPAIplUncredit)
  removeIplCredit(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: LopaIplCandidateActionDto) {
    return this.lopa.removeIplCredit(user.tenantId, user.id, id, candidateId, dto.reason, this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/reject')
  @Permissions(PermissionKeys.LOPAIplReject)
  rejectIplCandidate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: LopaIplCandidateActionDto) {
    return this.lopa.rejectIplCandidate(user.tenantId, user.id, id, candidateId, dto.reason, this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/reopen-validation')
  @Permissions(PermissionKeys.LOPAIplReopenValidation)
  reopenIplValidation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: LopaIplCandidateActionDto) {
    return this.lopa.reopenIplValidation(user.tenantId, user.id, id, candidateId, dto.reason, this.scope(user));
  }

  @Post(':id/ipl-candidates/:candidateId/proof-test')
  @Permissions(PermissionKeys.LOPAIplProofTestManage)
  updateIplProofTest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('candidateId') candidateId: string, @Body() dto: LopaIplProofTestDto) {
    return this.lopa.updateIplProofTest(user.tenantId, user.id, id, candidateId, dto, this.scope(user));
  }

  @Post(':id/ipls-safeguards/create-missing-data-actions')
  @Permissions(PermissionKeys.LOPAIplGapsManage)
  createIplMissingDataActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.createIplMissingDataActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/risk-calculation/context')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculationContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk-calculation/summary')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculationSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk-calculation/readiness')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculationReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationReadiness(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk-calculation/inputs')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculationInputs(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationInputs(user.tenantId, id, this.scope(user));
  }

  @Post(':id/risk-calculation/calculate')
  @Permissions(PermissionKeys.LOPARiskCalculationCalculate)
  calculateRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaRiskCalculationActionDto) {
    return this.lopa.calculateRisk( user.tenantId, user.id, id, dto, this.scope(user), false);
  }

  @Post(':id/risk-calculation/recalculate')
  @Permissions(PermissionKeys.LOPARiskCalculationRecalculate)
  recalculateRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaRiskCalculationActionDto) {
    return this.lopa.calculateRisk(user.tenantId, user.id, id, dto, this.scope(user), true);
  }

  @Post(':id/risk-calculation/save-snapshot')
  @Permissions(PermissionKeys.LOPARiskCalculationCalculate)
  saveRiskSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaRiskCalculationActionDto) {
    return this.lopa.saveRiskCalculationSnapshot(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk-calculation/lock')
  @Permissions(PermissionKeys.LOPARiskCalculationLock)
  lockRiskCalculation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaRiskCalculationActionDto) {
    return this.lopa.lockRiskCalculation(user.tenantId, user.id, id, dto.reason, this.scope(user));
  }

  @Post(':id/risk-calculation/unlock')
  @Permissions(PermissionKeys.LOPARiskCalculationUnlock)
  unlockRiskCalculation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaRiskCalculationActionDto) {
    return this.lopa.unlockRiskCalculation(user.tenantId, user.id, id, dto.reason, this.scope(user));
  }

  @Get(':id/risk-calculation/versions')
  @Permissions(PermissionKeys.LOPARiskCalculationVersionsView)
  riskCalculationVersions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationVersions(user.tenantId, id, this.scope(user));
  }

  @Get(':id/risk-calculation/versions/:versionId')
  @Permissions(PermissionKeys.LOPARiskCalculationVersionsView)
  riskCalculationVersion(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('versionId') versionId: string) {
    return this.lopa.riskCalculationVersion(user.tenantId, id, versionId, this.scope(user));
  }

  @Get(':id/risk-calculation/assumptions')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculationAssumptions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationAssumptions(user.tenantId, id, this.scope(user));
  }

  @Post(':id/risk-calculation/assumptions')
  @Permissions(PermissionKeys.LOPARiskCalculationAssumptionsManage)
  createRiskCalculationAssumption(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaRiskCalculationAssumptionDto) {
    return this.lopa.createRiskCalculationAssumption(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Patch(':id/risk-calculation/assumptions/:assumptionId')
  @Permissions(PermissionKeys.LOPARiskCalculationAssumptionsManage)
  updateRiskCalculationAssumption(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assumptionId') assumptionId: string, @Body() dto: UpsertLopaRiskCalculationAssumptionDto) {
    return this.lopa.updateRiskCalculationAssumption(user.tenantId, user.id, id, assumptionId, dto, this.scope(user));
  }

  @Delete(':id/risk-calculation/assumptions/:assumptionId')
  @Permissions(PermissionKeys.LOPARiskCalculationAssumptionsManage)
  deleteRiskCalculationAssumption(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('assumptionId') assumptionId: string) {
    return this.lopa.deleteRiskCalculationAssumption(user.tenantId, user.id, id, assumptionId, this.scope(user));
  }

  @Get(':id/risk-calculation/gaps')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculationGaps(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.riskCalculationGaps(user.tenantId, id, this.scope(user));
  }

  @Post(':id/risk-calculation/gaps')
  @Permissions(PermissionKeys.LOPARiskCalculationGapsManage)
  createRiskCalculationGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaRiskCalculationGapDto) {
    return this.lopa.createRiskCalculationGap(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/risk-calculation/gaps/:gapId/create-action')
  @Permissions(PermissionKeys.LOPARiskCalculationGapsManage)
  createRiskCalculationGapAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string) {
    return this.lopa.createRiskCalculationGapAction(user.tenantId, user.id, id, gapId, this.scope(user));
  }

  @Post(':id/risk-calculation/create-risk-gap-action')
  @Permissions(PermissionKeys.LOPARiskCalculationGapsManage)
  createRiskGapAction(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.createRiskGapAction(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/risk-calculation/create-missing-input-actions')
  @Permissions(PermissionKeys.LOPARiskCalculationGapsManage)
  createMissingInputActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.createMissingInputActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/risk-calculation/export')
  @Permissions(PermissionKeys.LOPARiskCalculationExport)
  exportRiskCalculation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaRiskCalculationFilterDto) {
    return this.lopa.exportRiskCalculation(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/risk-calculation')
  @Permissions(PermissionKeys.LOPARiskCalculationView)
  riskCalculation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaRiskCalculationFilterDto) {
    return this.lopa.riskCalculationTab(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/sil-determination')
  @Permissions(PermissionKeys.LOPASilView)
  silDetermination(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user));
  }

  @Get(':id/sil-determination/readiness')
  @Permissions(PermissionKeys.LOPASilView)
  silReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.readiness);
  }

  @Post(':id/sil-determination/determine')
  @Permissions(PermissionKeys.LOPASilDetermine)
  determineSil(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaSilActionDto) {
    return this.lopa.determineSil(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/sil-determination/lock')
  @Permissions(PermissionKeys.LOPASilLock)
  lockSil(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaSilActionDto) {
    return this.lopa.lockSilDetermination(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/sil-determination/unlock')
  @Permissions(PermissionKeys.LOPASilUnlock)
  unlockSil(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaSilActionDto) {
    return this.lopa.unlockSilDetermination(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/sil-determination/sifs')
  @Permissions(PermissionKeys.LOPASifCreate)
  createSif(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaSifDto) {
    return this.lopa.upsertSifSpecification(user.tenantId, user.id, id, null, dto, this.scope(user));
  }

  @Patch(':id/sil-determination/sifs/:sifId')
  @Permissions(PermissionKeys.LOPASifEdit)
  updateSif(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Body() dto: UpsertLopaSifDto) {
    return this.lopa.upsertSifSpecification(user.tenantId, user.id, id, sifId, dto, this.scope(user));
  }

  @Post(':id/sil-determination/reassess')
  @Permissions(PermissionKeys.LOPASilReassess)
  reassessSil(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaSilActionDto) { return this.lopa.reassessSil(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Patch(':id/sil-determination/:determinationId')
  @Permissions(PermissionKeys.LOPASilOverride)
  overrideSil(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('determinationId') determinationId: string, @Body() dto: LopaSilActionDto) { return this.lopa.overrideSilDetermination(user.tenantId, user.id, id, determinationId, dto, this.scope(user)); }

  @Get(':id/sil-determination/risk-snapshot')
  @Permissions(PermissionKeys.LOPASilView)
  silRiskSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.riskCalculation); }

  @Get(':id/sil-determination/methodology')
  @Permissions(PermissionKeys.LOPASilView)
  silMethodology(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.methodology); }

  @Get(':id/sil-determination/sif')
  @Permissions(PermissionKeys.LOPASifView)
  sifs(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.sifs); }

  @Get(':id/sil-determination/sif/:sifId')
  @Permissions(PermissionKeys.LOPASifView)
  sif(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => ({ specification: tab.sifs.find((row: any) => row.id === sifId), components: tab.components.filter((row: any) => row.sif_specification_id === sifId), architecture: tab.architectures.find((row: any) => row.sif_specification_id === sifId), proofTest: tab.proofTests.find((row: any) => row.sif_specification_id === sifId) })); }

  @Delete(':id/sil-determination/sif/:sifId')
  @Permissions(PermissionKeys.LOPASifDelete)
  deleteSif(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.deleteSifSpecification(user.tenantId, user.id, id, sifId, dto.reason, this.scope(user)); }

  @Post(':id/sil-determination/sif/:sifId/components')
  @Permissions(PermissionKeys.LOPASifComponentsManage)
  addSifComponent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Body() dto: UpsertLopaSifComponentDto) { return this.lopa.upsertSifComponent(user.tenantId, user.id, id, sifId, null, dto, this.scope(user)); }

  @Patch(':id/sil-determination/sif/:sifId/components/:componentId')
  @Permissions(PermissionKeys.LOPASifComponentsManage)
  updateSifComponent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Param('componentId') componentId: string, @Body() dto: UpsertLopaSifComponentDto) { return this.lopa.upsertSifComponent(user.tenantId, user.id, id, sifId, componentId, dto, this.scope(user)); }

  @Delete(':id/sil-determination/sif/:sifId/components/:componentId')
  @Permissions(PermissionKeys.LOPASifComponentsManage)
  deleteSifComponent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Param('componentId') componentId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.deleteSifComponent(user.tenantId, user.id, id, sifId, componentId, dto.reason, this.scope(user)); }

  @Patch(':id/sil-determination/sif/:sifId/architecture')
  @Permissions(PermissionKeys.LOPASifArchitectureManage)
  updateSifArchitecture(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Body() dto: UpsertLopaSifArchitectureDto) { return this.lopa.upsertSifArchitecture(user.tenantId, user.id, id, sifId, dto, this.scope(user)); }

  @Patch(':id/sil-determination/sif/:sifId/proof-test')
  @Permissions(PermissionKeys.LOPASifProofTestManage)
  updateSifProofTest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sifId') sifId: string, @Body() dto: UpsertLopaSifProofTestDto) { return this.lopa.upsertSifProofTest(user.tenantId, user.id, id, sifId, dto, this.scope(user)); }

  @Get(':id/sil-determination/iec61511-gaps')
  @Permissions(PermissionKeys.LOPAIec61511GapsView)
  silGaps(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.gaps); }

  @Post(':id/sil-determination/iec61511-gaps/generate')
  @Permissions(PermissionKeys.LOPAIec61511GapsManage)
  generateSilGaps(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.generateIec61511Gaps(user.tenantId, user.id, id, this.scope(user)); }

  @Patch(':id/sil-determination/iec61511-gaps/:gapId')
  @Permissions(PermissionKeys.LOPAIec61511GapsManage)
  updateSilGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string, @Body() dto: UpsertLopaSilGapDto) { return this.lopa.updateIec61511Gap(user.tenantId, user.id, id, gapId, dto, this.scope(user)); }

  @Post(':id/sil-determination/iec61511-gaps/:gapId/accept-exception')
  @Permissions(PermissionKeys.LOPAIec61511GapsAcceptException)
  acceptSilGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('gapId') gapId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.acceptIec61511Exception(user.tenantId, user.id, id, gapId, dto.reason, this.scope(user)); }

  @Get(':id/sil-determination/links')
  @Permissions(PermissionKeys.LOPASilView)
  silLinks(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.links); }

  @Post(':id/sil-determination/links')
  @Permissions(PermissionKeys.LOPASilLinksManage)
  addSilLink(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaSilLinkDto) { return this.lopa.createSilLink(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Delete(':id/sil-determination/links/:linkId')
  @Permissions(PermissionKeys.LOPASilLinksManage)
  removeSilLink(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.unlinkSilRecord(user.tenantId, user.id, id, linkId, dto.reason, this.scope(user)); }

  @Get(':id/sil-determination/actions')
  @Permissions(PermissionKeys.LOPASilView)
  silActions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.actions); }

  @Post(':id/sil-determination/actions')
  @Permissions(PermissionKeys.LOPASilActionsManage)
  createSilAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateLopaSilActionDto) { return this.lopa.createSilAction(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/sil-determination/actions/link-existing')
  @Permissions(PermissionKeys.LOPASilActionsManage)
  linkSilAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaSilActionDto & { actionId: string }) { return this.lopa.linkExistingSilAction(user.tenantId, user.id, id, dto.actionId, dto, this.scope(user)); }

  @Delete(':id/sil-determination/actions/:actionLinkId')
  @Permissions(PermissionKeys.LOPASilActionsManage)
  unlinkSilAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionLinkId') actionLinkId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.unlinkSilAction(user.tenantId, user.id, id, actionLinkId, dto.reason, this.scope(user)); }

  @Get(':id/sil-determination/snapshots')
  @Permissions(PermissionKeys.LOPASilSnapshotView)
  silSnapshots(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)).then(tab => tab.snapshots); }

  @Get(':id/sil-determination/snapshots/:snapshotId/compare')
  @Permissions(PermissionKeys.LOPASilSnapshotView)
  compareSilSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('snapshotId') snapshotId: string) { return this.lopa.compareSilSnapshot(user.tenantId, id, snapshotId, this.scope(user)); }

  @Post(':id/sil-determination/reassessment-events/check')
  @Permissions(PermissionKeys.LOPASilReassess)
  checkSilReassessment(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.checkSilReassessment(user.tenantId, user.id, id, this.scope(user)); }

  @Get(':id/sil-determination/export')
  @Permissions(PermissionKeys.LOPASilExport)
  exportSil(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.silDeterminationTab(user.tenantId, id, this.scope(user)); }

  @Get(':id/attachments')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachments(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaAttachmentFilterDto) { return this.lopa.attachmentsTab(user.tenantId, id, query, this.scope(user)); }

  @Get(':id/attachments/summary')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.attachmentsTab(user.tenantId, id, {}, this.scope(user)).then(tab => tab.summary); }

  @Get(':id/attachments/readiness')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.attachmentReadiness(user.tenantId, id, this.scope(user)); }

  @Get(':id/attachments/required-evidence')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentRequiredEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.attachmentReadiness(user.tenantId, id, this.scope(user)).then(result => result.checklist); }

  @Get(':id/attachments/context')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.attachmentContext(user.tenantId, id, this.scope(user)); }

  @Post(':id/attachments/upload')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.LOPAAttachmentsUpload)
  attachmentUpload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaAttachmentDto, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) { return this.lopa.uploadAttachment(user.tenantId, user.id, id, dto, file, this.scope(user)); }

  @Post(':id/attachments/bulk-upload')
  @UseInterceptors(FilesInterceptor('files', 20))
  @Permissions(PermissionKeys.LOPAAttachmentsUpload)
  attachmentBulkUpload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaAttachmentDto, @UploadedFiles() files?: Array<{ originalname: string; mimetype: string; size: number; buffer: Buffer }>) { if (!files?.length) throw new BadRequestException('Select at least one attachment file.'); return Promise.all(files.map(file => this.lopa.uploadAttachment(user.tenantId, user.id, id, dto, file, this.scope(user)))); }

  @Get(':id/attachments/document-search')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentDocumentSearch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query('q') q?: string) { return this.lopa.attachmentDocumentSearch(user.tenantId, id, q, this.scope(user)); }

  @Post(':id/attachments/link-document')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentLinkDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaAttachmentDocumentLinkDto) { return this.lopa.linkAttachmentDocument(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Delete(':id/attachments/document-links/:linkId')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentUnlinkDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.unlinkAttachmentDocument(user.tenantId, user.id, id, linkId, dto.reason, this.scope(user)); }

  @Post(':id/attachments/document-links/:linkId/refresh-status')
  @Permissions(PermissionKeys.LOPAAttachmentsDocumentLinkManage)
  attachmentRefreshDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) { return this.lopa.refreshAttachmentDocument(user.tenantId, user.id, id, linkId, this.scope(user)); }

  @Get(':id/attachments/evidence-mappings')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentMappings(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.attachmentEvidenceMappings(user.tenantId, id, this.scope(user)); }

  @Post(':id/attachments/evidence-mappings')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentEvidenceMap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaEvidenceMappingDto) { return this.lopa.upsertEvidenceMapping(user.tenantId, user.id, id, null, dto, this.scope(user)); }

  @Patch(':id/attachments/evidence-mappings/:mappingId')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentEvidenceMapUpdate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('mappingId') mappingId: string, @Body() dto: LopaEvidenceMappingDto) { return this.lopa.upsertEvidenceMapping(user.tenantId, user.id, id, mappingId, dto, this.scope(user)); }

  @Delete(':id/attachments/evidence-mappings/:mappingId')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentEvidenceMapDelete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('mappingId') mappingId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.deleteEvidenceMapping(user.tenantId, user.id, id, mappingId, dto.reason, this.scope(user)); }

  @Post(':id/attachments/bulk-update')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentBulkUpdate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaAttachmentBulkDto) { return this.lopa.attachmentBulkUpdate(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Post(':id/attachments/bulk-archive')
  @Permissions(PermissionKeys.LOPAAttachmentsArchive)
  attachmentBulkArchive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaAttachmentBulkDto) { return this.lopa.attachmentBulkUpdate(user.tenantId, user.id, id, { ...dto, action: 'archive' }, this.scope(user)); }

  @Post(':id/attachments/bulk-download')
  @Permissions(PermissionKeys.LOPAAttachmentsDownload)
  attachmentBulkDownload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaAttachmentBulkDto) { return this.lopa.attachmentBulkDownload(user.tenantId, user.id, id, dto, this.scope(user)); }

  @Get(':id/attachments/export-index')
  @Permissions(PermissionKeys.LOPAAttachmentsExport)
  attachmentExportIndex(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaAttachmentFilterDto) { return this.lopa.attachmentExportIndex(user.tenantId, user.id, id, query, this.scope(user)); }

  @Get(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.lopa.attachmentDetail(user.tenantId, id, attachmentId, this.scope(user)); }

  @Get(':id/attachments/:attachmentId/versions')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentVersions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.lopa.attachmentVersions(user.tenantId, id, attachmentId, this.scope(user)); }

  @Get(':id/attachments/:attachmentId/history')
  @Permissions(PermissionKeys.LOPAHistoryView)
  attachmentHistory(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.lopa.attachmentHistory(user.tenantId, id, attachmentId, this.scope(user)); }

  @Patch(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentUpdate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: UpsertLopaAttachmentDto) { return this.lopa.updateAttachment(user.tenantId, user.id, id, attachmentId, dto, this.scope(user)); }

  @Post(':id/attachments/:attachmentId/replace')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentReplace(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: UpsertLopaAttachmentDto, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) { return this.lopa.replaceAttachment(user.tenantId, user.id, id, attachmentId, dto, file, this.scope(user)); }

  @Post(':id/attachments/:attachmentId/archive')
  @Permissions(PermissionKeys.LOPAAttachmentsArchive)
  attachmentArchive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.archiveAttachment(user.tenantId, user.id, id, attachmentId, dto.reason, this.scope(user)); }

  @Post(':id/attachments/:attachmentId/restore')
  @Permissions(PermissionKeys.LOPAAttachmentsRestore)
  attachmentRestore(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.archiveAttachment(user.tenantId, user.id, id, attachmentId, dto.reason, this.scope(user), true); }

  @Delete(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.LOPAAttachmentsDelete)
  attachmentDelete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.deleteAttachment(user.tenantId, user.id, id, attachmentId, dto.reason, this.scope(user)); }

  @Get(':id/attachments/:attachmentId/preview')
  @Permissions(PermissionKeys.LOPAAttachmentsPreview)
  async attachmentPreview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Res() response: any) { const file = await this.lopa.attachmentAccess(user.tenantId, user.id, id, attachmentId, this.scope(user), 'preview'); response.setHeader('Content-Type', file.mimeType); response.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`); response.send(file.buffer); }

  @Get(':id/attachments/:attachmentId/download')
  @Permissions(PermissionKeys.LOPAAttachmentsDownload)
  async attachmentDownload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Res() response: any) { const file = await this.lopa.attachmentAccess(user.tenantId, user.id, id, attachmentId, this.scope(user), 'download'); response.setHeader('Content-Type', file.mimeType); response.setHeader('Content-Disposition', `attachment; filename="${file.fileName.replace(/"/g, '')}"`); response.send(file.buffer); }

  @Post(':id/attachments/:attachmentId/comments')
  @Permissions(PermissionKeys.LOPAAttachmentsEdit)
  attachmentComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Body() dto: LopaAttachmentCommentDto) { return this.lopa.addAttachmentComment(user.tenantId, user.id, id, attachmentId, dto, this.scope(user)); }

  @Get(':id/attachments/:attachmentId/comments')
  @Permissions(PermissionKeys.LOPAAttachmentsView)
  attachmentComments(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) { return this.lopa.attachmentComments(user.tenantId, id, attachmentId, this.scope(user)); }

  @Patch(':id/attachments/:attachmentId/comments/:commentId')
  @Permissions(PermissionKeys.LOPAAttachmentsCommentsManage)
  attachmentCommentUpdate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Param('commentId') commentId: string, @Body() dto: LopaAttachmentCommentDto) { return this.lopa.updateAttachmentComment(user.tenantId, user.id, id, attachmentId, commentId, dto, this.scope(user)); }

  @Delete(':id/attachments/:attachmentId/comments/:commentId')
  @Permissions(PermissionKeys.LOPAAttachmentsCommentsManage)
  attachmentCommentDelete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Param('commentId') commentId: string, @Body() dto: LopaActionReasonDto) { return this.lopa.deleteAttachmentComment(user.tenantId, user.id, id, attachmentId, commentId, dto.reason, this.scope(user)); }


  @Get(':id/history')
  @Permissions(PermissionKeys.LOPAHistoryView)
  history(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaAttachmentFilterDto) { return this.lopa.lopaHistory(user.tenantId, id, query, this.scope(user)); }

  @Get(':id/history/summary')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historySummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.lopaHistory(user.tenantId, id, {}, this.scope(user)).then(tab => tab.summary); }

  @Get(':id/history/timeline')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historyTimeline(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaAttachmentFilterDto) { return this.lopa.lopaHistoryTimeline(user.tenantId, id, query, this.scope(user)); }

  @Get(':id/history/context')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historyContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.lopaHistoryContext(user.tenantId, id, this.scope(user)); }

  @Get(':id/history/module-breakdown')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historyModuleBreakdown(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.lopaHistory(user.tenantId, id, {}, this.scope(user)).then(tab => tab.moduleBreakdown); }

  @Get(':id/history/workflow-timeline')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historyWorkflowTimeline(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.lopa.lopaHistory(user.tenantId, id, {}, this.scope(user)).then(tab => tab.workflowTimeline); }

  @Get(':id/history/export')
  @Permissions(PermissionKeys.LOPAHistoryExport)
  historyExport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaAttachmentFilterDto) { return this.lopa.lopaHistoryExport(user.tenantId, user.id, id, query, this.scope(user)); }

  @Get(':id/history/:eventId/diff')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historyDiff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) { return this.lopa.lopaHistoryDiff(user.tenantId, id, eventId, this.scope(user)); }

  @Get(':id/history/:eventId/audit-metadata')
  @Permissions(PermissionKeys.LOPAHistoryAuditMetadataView)
  historyAuditMetadata(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) { return this.lopa.lopaHistoryAuditMetadata(user.tenantId, id, eventId, this.scope(user)); }

  @Get(':id/history/:eventId')
  @Permissions(PermissionKeys.LOPAHistoryView)
  historyEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) { return this.lopa.lopaHistoryEvent(user.tenantId, id, eventId, this.scope(user)); }

  @Get(':id/recommendations/context')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendationsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.recommendationsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations/summary')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendationsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaRecommendationFilterDto) {
    return this.lopa.recommendationsTab(user.tenantId, id, query, this.scope(user)).then((tab) => tab.summary);
  }

  @Get(':id/recommendations/readiness')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendationsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.recommendationsReadiness(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations/source-findings')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendationSourceFindings(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.recommendationSourceFindings(user.tenantId, id, this.scope(user));
  }

  @Get(':id/recommendations/export')
  @Permissions(PermissionKeys.LOPARecommendationsExport)
  exportRecommendations(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaRecommendationFilterDto) {
    return this.lopa.exportRecommendations(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/recommendations')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendations(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaRecommendationFilterDto) {
    return this.lopa.recommendationsTab(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/recommendations')
  @Permissions(PermissionKeys.LOPARecommendationsCreate)
  createRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaRecommendationDto) {
    return this.lopa.createRecommendation(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/recommendations/:recommendationId')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendationDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.lopa.recommendationDetail(user.tenantId, id, recommendationId, this.scope(user));
  }

  @Patch(':id/recommendations/:recommendationId')
  @Permissions(PermissionKeys.LOPARecommendationsEdit)
  updateRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: UpsertLopaRecommendationDto) {
    return this.lopa.updateRecommendation(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Delete(':id/recommendations/:recommendationId')
  @Permissions(PermissionKeys.LOPARecommendationsDelete)
  deleteRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.deleteRecommendation(user.tenantId, user.id, id, recommendationId, dto.reason, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/change-status')
  @Permissions(PermissionKeys.LOPARecommendationsChangeStatus)
  changeRecommendationStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: LopaRecommendationStatusDto) {
    return this.lopa.changeRecommendationStatus(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/verify')
  @Permissions(PermissionKeys.LOPARecommendationsVerify)
  verifyRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: LopaRecommendationVerifyDto) {
    return this.lopa.verifyRecommendation(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Post(':id/recommendations/:recommendationId/reopen')
  @Permissions(PermissionKeys.LOPARecommendationsReopen)
  reopenRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.reopenRecommendation(user.tenantId, user.id, id, recommendationId, dto.reason, this.scope(user));
  }

  @Get(':id/recommendations/:recommendationId/evidence')
  @Permissions(PermissionKeys.LOPARecommendationsView)
  recommendationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string) {
    return this.lopa.recommendationEvidenceRows(user.tenantId, id, recommendationId);
  }

  @Post(':id/recommendations/:recommendationId/evidence')
  @Permissions(PermissionKeys.LOPARecommendationsEdit)
  createRecommendationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('recommendationId') recommendationId: string, @Body() dto: Record<string, unknown>) {
    return this.lopa.createRecommendationEvidence(user.tenantId, user.id, id, recommendationId, dto, this.scope(user));
  }

  @Delete(':id/recommendations/:recommendationId/evidence/:evidenceLinkId')
  @Permissions(PermissionKeys.LOPARecommendationsEdit)
  deleteRecommendationEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceLinkId') evidenceLinkId: string) {
    return this.lopa.deleteRecommendationEvidence(user.tenantId, user.id, id, evidenceLinkId, this.scope(user));
  }

  @Get(':id/actions')
  @Permissions(PermissionKeys.LOPAActionsView)
  lopaActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.lopaActions(user.tenantId, id, this.scope(user));
  }

  @Post(':id/actions/create-from-recommendation')
  @Permissions(PermissionKeys.LOPAActionsCreate)
  createActionFromRecommendation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateLopaActionDto) {
    return this.lopa.createLopaActionFromRecommendation(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/actions/create-from-gap')
  @Permissions(PermissionKeys.LOPAActionsCreate)
  createActionFromGap(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateLopaActionDto) {
    return this.lopa.createLopaActionFromRecommendation(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/actions/link-existing')
  @Permissions(PermissionKeys.LOPAActionsLink)
  linkExistingAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LinkExistingLopaActionDto) {
    return this.lopa.linkExistingLopaAction(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id/actions/:actionLinkId/unlink')
  @Permissions(PermissionKeys.LOPAActionsUnlink)
  unlinkAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionLinkId') actionLinkId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.unlinkLopaAction(user.tenantId, user.id, id, actionLinkId, dto.reason, this.scope(user));
  }

  @Post(':id/actions/sync')
  @Permissions(PermissionKeys.LOPAActionsSync)
  syncActions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.syncLopaActions(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/actions/:actionId/verify-closure')
  @Permissions(PermissionKeys.LOPAActionsVerifyClosure)
  verifyActionClosure(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.verifyLopaActionClosure(user.tenantId, user.id, id, actionId, dto.notes, this.scope(user));
  }

  @Post(':id/actions/send-reminder')
  @Permissions(PermissionKeys.LOPAActionsSendReminder)
  sendActionReminder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.sendLopaActionReminder(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/actions/escalate')
  @Permissions(PermissionKeys.LOPAActionsEscalate)
  escalateActions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.escalateLopaActions(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/linked-records/context')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecordsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.linkedRecordsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/linked-records/summary')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecordsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaLinkedRecordFilterDto) {
    return this.lopa.linkedRecordsTab(user.tenantId, id, query, this.scope(user)).then((tab) => tab.summary);
  }

  @Get(':id/linked-records/readiness')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecordsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.linkedRecordsRequired(user.tenantId, id, this.scope(user));
  }

  @Get(':id/linked-records/required')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecordsRequired(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.linkedRecordsRequired(user.tenantId, id, this.scope(user));
  }

  @Get(':id/linked-records/search-sources')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecordSources(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaLinkedRecordFilterDto) {
    return this.lopa.linkedRecordSourceSearch(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/linked-records/export')
  @Permissions(PermissionKeys.LOPALinkedRecordsExport)
  exportLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaLinkedRecordFilterDto) {
    return this.lopa.exportLinkedRecords(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/linked-records')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaLinkedRecordFilterDto) {
    return this.lopa.linkedRecordsTab(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/linked-records')
  @Permissions(PermissionKeys.LOPALinkedRecordsCreate)
  createLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaLinkedRecordDto) {
    return this.lopa.createLinkedRecord(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.LOPALinkedRecordsView)
  linkedRecordDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.lopa.linkedRecordDetail(user.tenantId, id, linkId, this.scope(user));
  }

  @Patch(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.LOPALinkedRecordsEdit)
  updateLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: UpsertLopaLinkedRecordDto) {
    return this.lopa.updateLinkedRecord(user.tenantId, user.id, id, linkId, dto, this.scope(user));
  }

  @Delete(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.LOPALinkedRecordsDelete)
  deleteLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.deleteLinkedRecord(user.tenantId, user.id, id, linkId, dto.reason, this.scope(user));
  }

  @Post(':id/linked-records/:linkId/sync')
  @Permissions(PermissionKeys.LOPALinkedRecordsSync)
  syncLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.lopa.syncLinkedRecord(user.tenantId, user.id, id, linkId, this.scope(user));
  }

  @Post(':id/linked-records/sync-all')
  @Permissions(PermissionKeys.LOPALinkedRecordsSync)
  syncAllLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.syncAllLinkedRecords(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/linked-records/:linkId/compare')
  @Permissions(PermissionKeys.LOPALinkedRecordsCompare)
  compareLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.lopa.compareLinkedRecord(user.tenantId, id, linkId, this.scope(user));
  }

  @Get(':id/team-sessions/context')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamSessionsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.teamSessionsContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions/summary')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamSessionsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.teamSessionsSummary(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions/readiness')
  @Permissions(PermissionKeys.LOPATeamReadinessView)
  teamSessionsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.teamSessionsTab(user.tenantId, id, {}, this.scope(user)).then((tab) => tab.readiness);
  }

  @Get(':id/team-sessions/user-search')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamUserSearch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.teamUserSearch(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/team-sessions/contact-search')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamContactSearch(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.teamUserSearch(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/team-sessions/export-attendance')
  @Permissions(PermissionKeys.LOPATeamSessionsExport)
  exportTeamAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.exportTeamSessions(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions/export-minutes')
  @Permissions(PermissionKeys.LOPATeamSessionsExport)
  exportTeamMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.exportTeamSessions(user.tenantId, id, this.scope(user));
  }

  @Get(':id/team-sessions')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamSessions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.teamSessionsTab(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/team-members/coverage')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamCoverage(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.teamSessionsTab(user.tenantId, id, {}, this.scope(user)).then((tab) => tab.coverage);
  }

  @Get(':id/team-members')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamMembers(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.teamMembers(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/team-members')
  @Permissions(PermissionKeys.LOPATeamMembersCreate)
  createTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaTeamMemberDto) {
    return this.lopa.createTeamMember(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/team-members/:memberId')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  teamMemberDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.lopa.teamMemberDetail(user.tenantId, id, memberId, this.scope(user));
  }

  @Patch(':id/team-members/:memberId')
  @Permissions(PermissionKeys.LOPATeamMembersEdit)
  updateTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: UpsertLopaTeamMemberDto) {
    return this.lopa.updateTeamMember(user.tenantId, user.id, id, memberId, dto, this.scope(user));
  }

  @Delete(':id/team-members/:memberId')
  @Permissions(PermissionKeys.LOPATeamMembersRemove)
  removeTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.removeTeamMember(user.tenantId, user.id, id, memberId, dto.reason, this.scope(user));
  }

  @Post(':id/team-members/:memberId/invite')
  @Permissions(PermissionKeys.LOPATeamMembersInvite)
  inviteTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: LopaTeamInviteDto) {
    return this.lopa.inviteTeamMember(user.tenantId, user.id, id, memberId, dto, this.scope(user));
  }

  @Post(':id/team-members/:memberId/resend-invite')
  @Permissions(PermissionKeys.LOPATeamMembersInvite)
  resendTeamInvite(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: LopaTeamInviteDto) {
    return this.lopa.inviteTeamMember(user.tenantId, user.id, id, memberId, dto, this.scope(user), true);
  }

  @Post(':id/team-members/:memberId/cancel-invite')
  @Permissions(PermissionKeys.LOPATeamMembersInvite)
  cancelTeamInvite(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: LopaTeamInviteDto) {
    return this.lopa.cancelTeamInvite(user.tenantId, user.id, id, memberId, dto, this.scope(user));
  }

  @Post(':id/team-members/send-invitations')
  @Permissions(PermissionKeys.LOPATeamMembersInvite)
  sendTeamInvitations(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaTeamInviteDto) {
    return this.lopa.sendTeamInvitations(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/team-members/:memberId/replace')
  @Permissions(PermissionKeys.LOPATeamMembersEdit)
  replaceTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: ReplaceLopaTeamMemberDto) {
    return this.lopa.replaceTeamMember(user.tenantId, user.id, id, memberId, dto, this.scope(user));
  }

  @Get(':id/sessions')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaTeamSessionsFilterDto) {
    return this.lopa.sessions(user.tenantId, id, query, this.scope(user));
  }

  @Post(':id/sessions')
  @Permissions(PermissionKeys.LOPASessionsCreate)
  createSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpsertLopaSessionDto) {
    return this.lopa.createSession(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/sessions/:sessionId')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessionDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.sessionDetail(user.tenantId, id, sessionId, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId')
  @Permissions(PermissionKeys.LOPASessionsEdit)
  updateSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: UpsertLopaSessionDto) {
    return this.lopa.updateSession(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Delete(':id/sessions/:sessionId')
  @Permissions(PermissionKeys.LOPASessionsCancel)
  deleteSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.deleteSession(user.tenantId, user.id, id, sessionId, dto.reason, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/cancel')
  @Permissions(PermissionKeys.LOPASessionsCancel)
  cancelSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.cancelSession(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/reschedule')
  @Permissions(PermissionKeys.LOPASessionsEdit)
  rescheduleSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: UpsertLopaSessionDto) {
    return this.lopa.rescheduleSession(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/complete')
  @Permissions(PermissionKeys.LOPASessionsComplete)
  completeSession(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.completeSession(user.tenantId, user.id, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/lock-minutes')
  @Permissions(PermissionKeys.LOPASessionsLockMinutes)
  lockMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.lockSessionMinutes(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/unlock-minutes')
  @Permissions(PermissionKeys.LOPASessionsUnlockMinutes)
  unlockMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.unlockSessionMinutes(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/agenda')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessionAgenda(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.sessionAgenda(user.tenantId, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/agenda')
  @Permissions(PermissionKeys.LOPASessionsAgendaManage)
  createAgenda(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: UpsertLopaSessionAgendaDto) {
    return this.lopa.createSessionAgenda(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/agenda/:agendaItemId')
  @Permissions(PermissionKeys.LOPASessionsAgendaManage)
  updateAgenda(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('agendaItemId') agendaItemId: string, @Body() dto: UpsertLopaSessionAgendaDto) {
    return this.lopa.updateSessionAgenda(user.tenantId, user.id, id, sessionId, agendaItemId, dto, this.scope(user));
  }

  @Delete(':id/sessions/:sessionId/agenda/:agendaItemId')
  @Permissions(PermissionKeys.LOPASessionsAgendaManage)
  deleteAgenda(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('agendaItemId') agendaItemId: string) {
    return this.lopa.deleteSessionAgenda(user.tenantId, user.id, id, sessionId, agendaItemId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/agenda/reorder')
  @Permissions(PermissionKeys.LOPASessionsAgendaManage)
  reorderAgenda(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: ReorderLopaSessionAgendaDto) {
    return this.lopa.reorderSessionAgenda(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/attendance')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessionAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.sessionAttendance(user.tenantId, id, sessionId, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/attendance')
  @Permissions(PermissionKeys.LOPASessionsAttendanceManage)
  updateAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: BulkLopaSessionAttendanceDto | UpsertLopaSessionAttendanceDto) {
    return this.lopa.updateSessionAttendance(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/attendance/bulk-mark')
  @Permissions(PermissionKeys.LOPASessionsAttendanceManage)
  bulkAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: BulkLopaSessionAttendanceDto) {
    return this.lopa.updateSessionAttendance(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/attendance/:attendanceId/confirm')
  @Permissions(PermissionKeys.LOPASessionsAttendanceManage)
  confirmAttendance(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('attendanceId') attendanceId: string) {
    return this.lopa.confirmSessionAttendance(user.tenantId, user.id, id, sessionId, attendanceId, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/minutes')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessionMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.sessionMinutes(user.tenantId, id, sessionId, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/minutes')
  @Permissions(PermissionKeys.LOPASessionsMinutesManage)
  updateMinutes(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: UpsertLopaSessionMinutesDto) {
    return this.lopa.updateSessionMinutes(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/decisions')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessionDecisions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.sessionDecisions(user.tenantId, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/decisions')
  @Permissions(PermissionKeys.LOPASessionsDecisionsManage)
  createDecision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: UpsertLopaSessionDecisionDto) {
    return this.lopa.createSessionDecision(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Patch(':id/sessions/:sessionId/decisions/:decisionId')
  @Permissions(PermissionKeys.LOPASessionsDecisionsManage)
  updateDecision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('decisionId') decisionId: string, @Body() dto: UpsertLopaSessionDecisionDto) {
    return this.lopa.updateSessionDecision(user.tenantId, user.id, id, sessionId, decisionId, dto, this.scope(user));
  }

  @Delete(':id/sessions/:sessionId/decisions/:decisionId')
  @Permissions(PermissionKeys.LOPASessionsDecisionsManage)
  deleteDecision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('decisionId') decisionId: string) {
    return this.lopa.deleteSessionDecision(user.tenantId, user.id, id, sessionId, decisionId, this.scope(user));
  }

  @Get(':id/sessions/:sessionId/actions')
  @Permissions(PermissionKeys.LOPATeamSessionsView)
  sessionActions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.sessionActions(user.tenantId, id, sessionId, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/actions/create')
  @Permissions(PermissionKeys.LOPASessionsActionsManage)
  createSessionAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: CreateLopaActionDto) {
    return this.lopa.createSessionAction(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/actions/link-existing')
  @Permissions(PermissionKeys.LOPASessionsActionsManage)
  linkSessionAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Body() dto: LinkExistingLopaActionDto) {
    return this.lopa.linkExistingSessionAction(user.tenantId, user.id, id, sessionId, dto, this.scope(user));
  }

  @Delete(':id/sessions/:sessionId/actions/:actionLinkId/unlink')
  @Permissions(PermissionKeys.LOPASessionsActionsManage)
  unlinkSessionAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string, @Param('actionLinkId') actionLinkId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.unlinkSessionAction(user.tenantId, user.id, id, sessionId, actionLinkId, dto.reason, this.scope(user));
  }

  @Post(':id/sessions/:sessionId/actions/sync')
  @Permissions(PermissionKeys.LOPASessionsActionsManage)
  syncSessionActions(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.lopa.syncSessionActions(user.tenantId, user.id, id, sessionId, this.scope(user));
  }

  @Get(':id/final-report')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaFinalReportFilterDto) {
    return this.lopa.finalReportTab(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/final-report/summary')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportTab(user.tenantId, id, {}, this.scope(user)).then((tab) => tab.summary);
  }

  @Get(':id/final-report/readiness')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportReadiness(user.tenantId, id, this.scope(user));
  }

  @Get(':id/final-report/templates')
  @Permissions(PermissionKeys.LOPAFinalReportTemplatesView)
  finalReportTemplates(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportTemplates(user.tenantId, id, this.scope(user));
  }

  @Get(':id/final-report/sections')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportSections(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportSections(user.tenantId, id, this.scope(user));
  }

  @Patch(':id/final-report/sections')
  @Permissions(PermissionKeys.LOPAFinalReportSectionsManage)
  updateFinalReportSections(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportSectionsDto) {
    return this.lopa.updateFinalReportSections(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/final-report/preview')
  @Permissions(PermissionKeys.LOPAFinalReportPreview)
  previewFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportGenerateDto) {
    return this.lopa.previewFinalReport(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/final-report/generate')
  @Permissions(PermissionKeys.LOPAFinalReportGenerate)
  generateFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportGenerateDto) {
    return this.lopa.generateFinalReport(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/final-report/generate-package')
  @Permissions(PermissionKeys.LOPAFinalReportGeneratePackage)
  generateFinalReportPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportPackageDto) {
    return this.lopa.generateFinalReportPackage(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Get(':id/final-report/reports')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportRegister(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: LopaFinalReportFilterDto) {
    return this.lopa.finalReportRegister(user.tenantId, id, query, this.scope(user));
  }

  @Get(':id/final-report/reports/:reportId')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string) {
    return this.lopa.finalReportDetail(user.tenantId, id, reportId, this.scope(user));
  }

  @Get(':id/final-report/reports/:reportId/preview')
  @Permissions(PermissionKeys.LOPAFinalReportPreview)
  finalReportPreview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string) {
    return this.lopa.finalReportPreviewById(user.tenantId, id, reportId, this.scope(user));
  }

  @Get(':id/final-report/reports/:reportId/download')
  @Permissions(PermissionKeys.LOPAFinalReportDownload)
  finalReportDownload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Res() res: any) {
    return this.lopa.downloadFinalReport(user.tenantId, user.id, id, reportId, this.scope(user)).then(({ fileName, mimeType, buffer }) => {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    });
  }

  @Post(':id/final-report/reports/:reportId/mark-official')
  @Permissions(PermissionKeys.LOPAFinalReportMarkOfficial)
  markFinalReportOfficial(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.markFinalReportOfficial(user.tenantId, user.id, id, reportId, dto.reason, this.scope(user));
  }

  @Post(':id/final-report/reports/:reportId/publish-document-control')
  @Permissions(PermissionKeys.LOPAFinalReportPublishDocumentControl)
  publishFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: LopaReportPublishDto) {
    return this.lopa.publishFinalReport(user.tenantId, user.id, id, reportId, dto, this.scope(user));
  }

  @Post(':id/final-report/reports/:reportId/supersede')
  @Permissions(PermissionKeys.LOPAFinalReportSupersede)
  supersedeFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.supersedeFinalReport(user.tenantId, user.id, id, reportId, dto.reason, this.scope(user));
  }

  @Post(':id/final-report/reports/:reportId/archive')
  @Permissions(PermissionKeys.LOPAFinalReportArchive)
  archiveFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.archiveFinalReport(user.tenantId, user.id, id, reportId, dto.reason, this.scope(user));
  }

  @Post(':id/final-report/reports/:reportId/restore')
  @Permissions(PermissionKeys.LOPAFinalReportRestore)
  restoreFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.restoreFinalReport(user.tenantId, user.id, id, reportId, dto.reason, this.scope(user));
  }

  @Get(':id/final-report/source-snapshot')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportSourceSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportSourceSnapshots(user.tenantId, id, this.scope(user));
  }

  @Post(':id/final-report/source-snapshot')
  @Permissions(PermissionKeys.LOPAFinalReportGenerate)
  createFinalReportSourceSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.createFinalReportSourceSnapshot(user.tenantId, user.id, id, this.scope(user));
  }

  @Get(':id/final-report/source-snapshot/:snapshotId')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportSourceSnapshotDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('snapshotId') snapshotId: string) {
    return this.lopa.finalReportSourceSnapshotDetail(user.tenantId, id, snapshotId, this.scope(user));
  }

  @Get(':id/final-report/appendices')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportAppendices(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportAppendices(user.tenantId, id, this.scope(user));
  }

  @Post(':id/final-report/appendices/:appendixKey/preview')
  @Permissions(PermissionKeys.LOPAFinalReportPreview)
  previewFinalReportAppendix(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('appendixKey') appendixKey: string) {
    return this.lopa.previewFinalReportAppendix(user.tenantId, user.id, id, appendixKey, this.scope(user));
  }

  @Post(':id/final-report/appendices/:appendixKey/export')
  @Permissions(PermissionKeys.LOPAFinalReportGenerate)
  exportFinalReportAppendix(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('appendixKey') appendixKey: string, @Body() dto: LopaReportGenerateDto) {
    return this.lopa.exportFinalReportAppendix(user.tenantId, user.id, id, appendixKey, dto, this.scope(user));
  }

  @Get(':id/final-report/packages')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportPackages(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportPackages(user.tenantId, id, this.scope(user));
  }

  @Get(':id/final-report/packages/:packageId')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportPackageDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('packageId') packageId: string) {
    return this.lopa.finalReportPackageDetail(user.tenantId, id, packageId, this.scope(user));
  }

  @Get(':id/final-report/packages/:packageId/download')
  @Permissions(PermissionKeys.LOPAFinalReportDownload)
  finalReportPackageDownload(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('packageId') packageId: string, @Res() res: any) {
    return this.lopa.downloadFinalReportPackage(user.tenantId, user.id, id, packageId, this.scope(user)).then(({ fileName, mimeType, buffer }) => {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    });
  }

  @Post(':id/final-report/packages/:packageId/archive')
  @Permissions(PermissionKeys.LOPAFinalReportArchive)
  archiveFinalReportPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('packageId') packageId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.archiveFinalReportPackage(user.tenantId, user.id, id, packageId, dto.reason, this.scope(user));
  }

  @Post(':id/final-report/packages/:packageId/restore')
  @Permissions(PermissionKeys.LOPAFinalReportRestore)
  restoreFinalReportPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('packageId') packageId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.restoreFinalReportPackage(user.tenantId, user.id, id, packageId, dto.reason, this.scope(user));
  }

  @Get(':id/final-report/redaction-preview')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportRedaction(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportRedactionPreview(user.tenantId, id, this.scope(user));
  }

  @Post(':id/final-report/redaction-preview')
  @Permissions(PermissionKeys.LOPAFinalReportRedactedExport)
  refreshFinalReportRedaction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportGenerateDto) {
    return this.lopa.finalReportRedactionPreview(user.tenantId, id, this.scope(user), dto);
  }

  @Get(':id/final-report/export-history')
  @Permissions(PermissionKeys.LOPAFinalReportHistoryView)
  finalReportExportHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportExportHistory(user.tenantId, id, this.scope(user));
  }

  @Post(':id/final-report/export-excel')
  @Permissions(PermissionKeys.LOPAFinalReportExportExcel)
  exportFinalReportExcel(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportGenerateDto) {
    return this.lopa.exportFinalReportTable(user.tenantId, user.id, id, 'Excel', dto, this.scope(user));
  }

  @Post(':id/final-report/export-csv')
  @Permissions(PermissionKeys.LOPAFinalReportExportCsv)
  exportFinalReportCsv(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportGenerateDto) {
    return this.lopa.exportFinalReportTable(user.tenantId, user.id, id, 'CSV', dto, this.scope(user));
  }

  @Post(':id/final-report/export-audit-package')
  @Permissions(PermissionKeys.LOPAFinalReportGeneratePackage)
  exportFinalReportAuditPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportPackageDto) {
    return this.lopa.generateFinalReportPackage(user.tenantId, user.id, id, { ...dto, packageName: dto.packageName ?? 'Full Audit Package' }, this.scope(user));
  }

  @Get(':id/final-report/distribution')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportDistribution(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportDistribution(user.tenantId, id, this.scope(user));
  }

  @Post(':id/final-report/distribution/share')
  @Permissions(PermissionKeys.LOPAFinalReportShare)
  shareFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: LopaReportShareDto) {
    return this.lopa.shareFinalReport(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/final-report/distribution/:distributionId/revoke')
  @Permissions(PermissionKeys.LOPAFinalReportShare)
  revokeFinalReportShare(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('distributionId') distributionId: string, @Body() dto: LopaActionReasonDto) {
    return this.lopa.revokeFinalReportShare(user.tenantId, user.id, id, distributionId, dto.reason, this.scope(user));
  }

  @Post(':id/final-report/distribution/:distributionId/resend')
  @Permissions(PermissionKeys.LOPAFinalReportShare)
  resendFinalReportShare(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('distributionId') distributionId: string) {
    return this.lopa.resendFinalReportShare(user.tenantId, user.id, id, distributionId, this.scope(user));
  }

  @Get(':id/final-report/context')
  @Permissions(PermissionKeys.LOPAFinalReportView)
  finalReportContext(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.finalReportContext(user.tenantId, id, this.scope(user));
  }

  @Get(':id')
  @Permissions(PermissionKeys.LOPAView)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lopa.get(user.tenantId, id, this.scope(user));
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }
}
