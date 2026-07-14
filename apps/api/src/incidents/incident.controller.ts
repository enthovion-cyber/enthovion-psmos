import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { IncidentService } from './incident.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidents: IncidentService) {}

  @Get()
  @Permissions(PermissionKeys.IncidentsRegisterView)
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.dashboard(user.tenantId, user.id, this.scope(user), query, user.permissions); }

  @Get('summary')
  @Permissions(PermissionKeys.IncidentsSummaryView)
  summary(@CurrentUser() user: RequestUser) { return this.incidents.summary(user.tenantId, this.scope(user), user.permissions); }

  @Get('attention')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  attention(@CurrentUser() user: RequestUser) { return this.incidents.attention(user.tenantId, this.scope(user), user.permissions); }

  @Get('psm-events')
  @Permissions(PermissionKeys.IncidentsPsmView)
  psmEvents(@CurrentUser() user: RequestUser) { return this.incidents.psmEvents(user.tenantId, this.scope(user), user.permissions); }

  @Get('high-potential')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  highPotential(@CurrentUser() user: RequestUser) { return this.incidents.highPotential(user.tenantId, this.scope(user), user.permissions); }

  @Get('investigation-status')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  investigationStatus(@CurrentUser() user: RequestUser) { return this.incidents.investigationStatus(user.tenantId, this.scope(user), user.permissions); }

  @Get('action-snapshot')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  actionSnapshot(@CurrentUser() user: RequestUser) { return this.incidents.actionSnapshot(user.tenantId, this.scope(user), user.permissions); }

  @Get('trends')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  trends(@CurrentUser() user: RequestUser) { return this.incidents.trends(user.tenantId, this.scope(user), user.permissions); }

  @Get('register')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  register(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.register(user.tenantId, this.scope(user), query, user.permissions); }

  @Get('filters/context')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  filterContext(@CurrentUser() user: RequestUser) { return this.incidents.filterContext(user.tenantId, this.scope(user)); }

  @Get('context')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  context(@CurrentUser() user: RequestUser) { return this.incidents.filterContext(user.tenantId, this.scope(user)); }

  @Get('new/context')
  @Permissions(PermissionKeys.IncidentsCreate)
  createContext(@CurrentUser() user: RequestUser) { return this.incidents.createContext(user.tenantId, user.id, this.scope(user), user.permissions); }

  @Get('new/site-context')
  @Permissions(PermissionKeys.IncidentsCreate)
  siteContext(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.siteContext(user.tenantId, this.scope(user), query); }

  @Get('new/risk-matrix')
  @Permissions(PermissionKeys.IncidentsCreate)
  riskMatrix(@CurrentUser() user: RequestUser) { return this.incidents.riskMatrix(user.tenantId, this.scope(user)); }

  @Get('new/classification-config')
  @Permissions(PermissionKeys.IncidentsCreate)
  classificationConfig(@CurrentUser() user: RequestUser) { return this.incidents.classificationConfig(user.tenantId, this.scope(user)); }

  @Get('new/pse-threshold-config')
  @Permissions(PermissionKeys.IncidentsCreate)
  pseThresholdConfig(@CurrentUser() user: RequestUser) { return this.incidents.pseThresholdConfig(user.tenantId, this.scope(user)); }

  @Post('drafts')
  @Permissions(PermissionKeys.IncidentsDraftCreate)
  createDraft(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.createDraft(user.tenantId, user.id, this.scope(user), dto); }

  @Get('drafts/:draftId')
  @Permissions(PermissionKeys.IncidentsDraftEdit)
  getDraft(@CurrentUser() user: RequestUser, @Param('draftId') draftId: string) { return this.incidents.getDraft(user.tenantId, user.id, this.scope(user), draftId); }

  @Patch('drafts/:draftId')
  @Permissions(PermissionKeys.IncidentsDraftEdit)
  updateDraft(@CurrentUser() user: RequestUser, @Param('draftId') draftId: string, @Body() dto: Record<string, any>) { return this.incidents.updateDraft(user.tenantId, user.id, this.scope(user), draftId, dto); }

  @Delete('drafts/:draftId')
  @Permissions(PermissionKeys.IncidentsDraftDelete)
  deleteDraft(@CurrentUser() user: RequestUser, @Param('draftId') draftId: string) { return this.incidents.deleteDraft(user.tenantId, user.id, this.scope(user), draftId); }

  @Post('drafts/:draftId/submit')
  @Permissions(PermissionKeys.IncidentsSubmit)
  submitDraft(@CurrentUser() user: RequestUser, @Param('draftId') draftId: string) { return this.incidents.submitDraft(user.tenantId, user.id, this.scope(user), draftId, user.permissions); }

  @Post()
  @Permissions(PermissionKeys.IncidentsSubmit)
  submitIncident(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.submitIncident(user.tenantId, user.id, this.scope(user), dto, user.permissions); }

  @Post('validate')
  @Permissions(PermissionKeys.IncidentsCreate)
  validateIncident(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.validateIncident({ ...dto, canCreateRestricted: user.permissions.includes('incidents.restricted.create'), canCreateConfidential: user.permissions.includes('incidents.confidential.create') }, !!dto.finalSubmit); }

  @Post('calculate-potential-risk')
  @Permissions(PermissionKeys.IncidentsCreate)
  calculatePotentialRisk(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.calculatePotentialRisk(user.tenantId, this.scope(user), dto); }

  @Post('classify-psm-pse')
  @Permissions(PermissionKeys.IncidentsPsmClassify)
  classifyPsmPse(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.classifyPsmPse(user.tenantId, this.scope(user), dto); }

  @Post('recommend-followups')
  @Permissions(PermissionKeys.IncidentsCreate)
  recommendFollowups(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.recommendFollowups(user.tenantId, this.scope(user), dto); }

  @Get('saved-views')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  savedViews(@CurrentUser() user: RequestUser) { return this.incidents.savedViews(user.tenantId, user.id, this.scope(user)); }

  @Post('saved-views')
  @Permissions(PermissionKeys.IncidentsSavedViewsCreate)
  createSavedView(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.saveView(user.tenantId, user.id, this.scope(user), dto); }

  @Patch('saved-views/:viewId')
  @Permissions(PermissionKeys.IncidentsSavedViewsCreate)
  updateSavedView(@CurrentUser() user: RequestUser, @Param('viewId') viewId: string, @Body() dto: Record<string, any>) { return this.incidents.updateView(user.tenantId, user.id, viewId, dto); }

  @Delete('saved-views/:viewId')
  @Permissions(PermissionKeys.IncidentsSavedViewsCreate)
  deleteSavedView(@CurrentUser() user: RequestUser, @Param('viewId') viewId: string) { return this.incidents.deleteView(user.tenantId, user.id, viewId); }

  @Post('bulk-update')
  @Permissions(PermissionKeys.IncidentsBulkUpdate)
  bulkUpdate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.bulkUpdate(user.tenantId, user.id, this.scope(user), dto); }

  @Post('bulk-assign')
  @Permissions(PermissionKeys.IncidentsAssign)
  bulkAssign(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.bulkAssign(user.tenantId, user.id, this.scope(user), dto); }

  @Post('bulk-create-action')
  @Permissions(PermissionKeys.IncidentsActionsCreate)
  bulkCreateAction(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.bulkUpdate(user.tenantId, user.id, this.scope(user), { ...dto, reason: dto.reason ?? 'Bulk action creation requested' }); }

  @Get('export')
  @Permissions(PermissionKeys.IncidentsExport)
  export(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.export(user.tenantId, user.id, this.scope(user), query, user.permissions, 'register'); }

  @Get('export/psm-events')
  @Permissions(PermissionKeys.IncidentsExport)
  exportPsm(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.export(user.tenantId, user.id, this.scope(user), query, user.permissions, 'psm-events'); }

  @Get('export/high-potential')
  @Permissions(PermissionKeys.IncidentsExport)
  exportHighPotential(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.export(user.tenantId, user.id, this.scope(user), query, user.permissions, 'high-potential'); }

  @Get('export/overdue')
  @Permissions(PermissionKeys.IncidentsExport)
  exportOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.incidents.export(user.tenantId, user.id, this.scope(user), query, user.permissions, 'overdue'); }

  @Get('equipment-search')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  equipmentSearch(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.equipmentSearch(user.tenantId, this.scope(user), search); }

  @Get('lookups/equipment')
  @Permissions(PermissionKeys.IncidentsEquipmentLookup)
  lookupEquipment(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.equipmentSearch(user.tenantId, this.scope(user), search); }

  @Get('chemical-search')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  chemicalSearch(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.chemicalSearch(user.tenantId, search); }

  @Get('lookups/chemicals')
  @Permissions(PermissionKeys.IncidentsChemicalLookup)
  lookupChemicals(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.chemicalSearch(user.tenantId, search); }

  @Get('lookups/sds')
  @Permissions(PermissionKeys.IncidentsChemicalLookup)
  lookupSds(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.genericLookup(user.tenantId, this.scope(user), 'sds', search); }

  @Get('lookups/ptw')
  @Permissions(PermissionKeys.IncidentsPtwLookup)
  lookupPtw(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.genericLookup(user.tenantId, this.scope(user), 'ptw', search); }

  @Get('lookups/moc')
  @Permissions(PermissionKeys.IncidentsMocLookup)
  lookupMoc(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.genericLookup(user.tenantId, this.scope(user), 'moc', search); }

  @Get('lookups/pssr')
  @Permissions(PermissionKeys.IncidentsPssrLookup)
  lookupPssr(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.genericLookup(user.tenantId, this.scope(user), 'pssr', search); }

  @Get('user-search')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  userSearch(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.userSearch(user.tenantId, search); }

  @Get('lookups/users')
  @Permissions(PermissionKeys.IncidentsCreate)
  lookupUsers(@CurrentUser() user: RequestUser, @Query('search') search = '') { return this.incidents.userSearch(user.tenantId, search); }

  @Post('evidence/upload')
  @Permissions(PermissionKeys.IncidentsEvidenceUpload)
  uploadEvidence(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.incidents.uploadEvidence(user.tenantId, user.id, this.scope(user), dto); }

  @Delete('evidence/:evidenceId')
  @Permissions(PermissionKeys.IncidentsEvidenceUpload)
  deleteEvidence(@CurrentUser() user: RequestUser, @Param('evidenceId') evidenceId: string) { return this.incidents.deleteEvidence(user.tenantId, user.id, evidenceId); }

  @Get(':id/header')
  @Permissions(PermissionKeys.IncidentsDetailView)
  header(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.detailHeader(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/status-bar')
  @Permissions(PermissionKeys.IncidentsDetailView)
  statusBar(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.statusBar(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/tabs')
  @Permissions(PermissionKeys.IncidentsDetailView)
  tabs(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.tabStatus(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/overview')
  @Permissions(PermissionKeys.IncidentsOverviewView)
  overview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.overview(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/overview/:section')
  @Permissions(PermissionKeys.IncidentsOverviewView)
  overviewSection(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('section') section: string) { return this.incidents.overviewSection(user.tenantId, this.scope(user), id, section, user.permissions); }

  @Get(':id/event-details')
  @Permissions(PermissionKeys.IncidentsEventDetailsView)
  eventDetails(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.eventDetails(user.tenantId, this.scope(user), id, user.permissions); }

  @Patch(':id/event-details')
  @Permissions(PermissionKeys.IncidentsEventDetailsEdit)
  updateEventDetails(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateEventDetails(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/event-details/request-classification-review')
  @Permissions(PermissionKeys.IncidentsClassificationReviewRequest)
  requestClassificationReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestClassificationReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/event-details/approve-classification')
  @Permissions(PermissionKeys.IncidentsClassificationReviewApprove)
  approveClassification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideClassificationReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/event-details/reject-classification')
  @Permissions(PermissionKeys.IncidentsClassificationReviewReject)
  rejectClassification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideClassificationReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/severity-risk')
  @Permissions(PermissionKeys.IncidentsSeverityView)
  severityRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.severityRiskTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Patch(':id/severity-risk')
  @Permissions(PermissionKeys.IncidentsSeverityEdit)
  updateSeverityRisk(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateSeverityRisk(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/severity-risk/recalculate')
  @Permissions(PermissionKeys.IncidentsSeverityRecalculate)
  recalculateSeverityRisk(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.recalculateSeverityRisk(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Post(':id/severity-risk/request-review')
  @Permissions(PermissionKeys.IncidentsSeverityReviewRequest)
  requestSeverityReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestSeverityReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/severity-risk/approve-review')
  @Permissions(PermissionKeys.IncidentsSeverityReviewApprove)
  approveSeverityReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideSeverityReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/severity-risk/reject-review')
  @Permissions(PermissionKeys.IncidentsSeverityReviewReject)
  rejectSeverityReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideSeverityReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/people-injury')
  @Permissions(PermissionKeys.IncidentsPeopleView)
  peopleInjury(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.peopleInjuryTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Post(':id/people')
  @Permissions(PermissionKeys.IncidentsPeopleEdit)
  createPerson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createIncidentPerson(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/people/:personId')
  @Permissions(PermissionKeys.IncidentsPeopleEdit)
  updatePerson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('personId') personId: string, @Body() dto: Record<string, any>) { return this.incidents.updateIncidentPerson(user.tenantId, user.id, this.scope(user), id, personId, dto, user.permissions); }

  @Delete(':id/people/:personId')
  @Permissions(PermissionKeys.IncidentsPeopleDelete)
  deletePerson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('personId') personId: string) { return this.incidents.deleteIncidentPerson(user.tenantId, user.id, this.scope(user), id, personId, user.permissions); }

  @Post(':id/people/review-request')
  @Permissions(PermissionKeys.IncidentsPeopleReviewRequest)
  requestPeopleReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestPeopleReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/people/review-approve')
  @Permissions(PermissionKeys.IncidentsPeopleReviewApprove)
  approvePeopleReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decidePeopleReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/people/review-reject')
  @Permissions(PermissionKeys.IncidentsPeopleReviewReject)
  rejectPeopleReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decidePeopleReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/asset-chemical')
  @Permissions(PermissionKeys.IncidentsAssetsView)
  assetChemical(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.assetChemicalTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Post(':id/equipment')
  @Permissions(PermissionKeys.IncidentsAssetsEdit)
  createEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createIncidentEquipment(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/equipment/:equipmentRowId')
  @Permissions(PermissionKeys.IncidentsAssetsEdit)
  updateEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('equipmentRowId') equipmentRowId: string, @Body() dto: Record<string, any>) { return this.incidents.updateIncidentEquipment(user.tenantId, user.id, this.scope(user), id, equipmentRowId, dto, user.permissions); }

  @Delete(':id/equipment/:equipmentRowId')
  @Permissions(PermissionKeys.IncidentsAssetsDelete)
  deleteEquipment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('equipmentRowId') equipmentRowId: string) { return this.incidents.deleteIncidentAssetRow(user.tenantId, user.id, this.scope(user), id, equipmentRowId, user.permissions); }

  @Post(':id/chemicals')
  @Permissions(PermissionKeys.IncidentsAssetsEdit)
  createChemical(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createIncidentChemical(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/chemicals/:chemicalRowId')
  @Permissions(PermissionKeys.IncidentsAssetsEdit)
  updateChemical(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('chemicalRowId') chemicalRowId: string, @Body() dto: Record<string, any>) { return this.incidents.updateIncidentChemical(user.tenantId, user.id, this.scope(user), id, chemicalRowId, dto, user.permissions); }

  @Delete(':id/chemicals/:chemicalRowId')
  @Permissions(PermissionKeys.IncidentsAssetsDelete)
  deleteChemical(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('chemicalRowId') chemicalRowId: string) { return this.incidents.deleteIncidentAssetRow(user.tenantId, user.id, this.scope(user), id, chemicalRowId, user.permissions); }

  @Post(':id/asset-chemical/review-request')
  @Permissions(PermissionKeys.IncidentsAssetReviewRequest)
  requestAssetReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestAssetReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/asset-chemical/review-approve')
  @Permissions(PermissionKeys.IncidentsAssetReviewApprove)
  approveAssetReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideAssetReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/asset-chemical/review-reject')
  @Permissions(PermissionKeys.IncidentsAssetReviewReject)
  rejectAssetReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideAssetReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/timeline')
  @Permissions(PermissionKeys.IncidentsTimelineView)
  timeline(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.timelineTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Post(':id/timeline/events')
  @Permissions(PermissionKeys.IncidentsTimelineEdit)
  createTimelineEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createTimelineEvent(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/timeline/events/:eventId')
  @Permissions(PermissionKeys.IncidentsTimelineEdit)
  updateTimelineEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string, @Body() dto: Record<string, any>) { return this.incidents.updateTimelineEvent(user.tenantId, user.id, this.scope(user), id, eventId, dto, user.permissions); }

  @Delete(':id/timeline/events/:eventId')
  @Permissions(PermissionKeys.IncidentsTimelineDelete)
  deleteTimelineEvent(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) { return this.incidents.deleteTimelineEvent(user.tenantId, user.id, this.scope(user), id, eventId, user.permissions); }

  @Post(':id/timeline/review-request')
  @Permissions(PermissionKeys.IncidentsTimelineReviewRequest)
  requestTimelineReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestTimelineReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/timeline/review-approve')
  @Permissions(PermissionKeys.IncidentsTimelineReviewApprove)
  approveTimelineReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideTimelineReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/timeline/review-reject')
  @Permissions(PermissionKeys.IncidentsTimelineReviewReject)
  rejectTimelineReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideTimelineReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/evidence-attachments')
  @Permissions(PermissionKeys.IncidentsEvidenceView)
  evidenceAttachments(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.evidenceAttachmentsTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Post(':id/evidence')
  @Permissions(PermissionKeys.IncidentsEvidenceUpload)
  createEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createIncidentEvidence(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/evidence/:evidenceId')
  @Permissions(PermissionKeys.IncidentsEvidenceEdit)
  updateEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) { return this.incidents.updateIncidentEvidence(user.tenantId, user.id, this.scope(user), id, evidenceId, dto, user.permissions); }

  @Delete(':id/evidence/:evidenceId')
  @Permissions(PermissionKeys.IncidentsEvidenceDelete)
  deleteIncidentEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string) { return this.incidents.deleteIncidentEvidence(user.tenantId, user.id, this.scope(user), id, evidenceId, user.permissions); }

  @Post(':id/evidence/:evidenceId/archive')
  @Permissions(PermissionKeys.IncidentsEvidenceEdit)
  archiveEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) { return this.incidents.archiveIncidentEvidence(user.tenantId, user.id, this.scope(user), id, evidenceId, dto, user.permissions); }

  @Post(':id/evidence/:evidenceId/version')
  @Permissions(PermissionKeys.IncidentsEvidenceVersionManage)
  createEvidenceVersion(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) { return this.incidents.createEvidenceVersion(user.tenantId, user.id, this.scope(user), id, evidenceId, dto, user.permissions); }

  @Post(':id/evidence/:evidenceId/mappings')
  @Permissions(PermissionKeys.IncidentsEvidenceMappingManage)
  createEvidenceMapping(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) { return this.incidents.createEvidenceMapping(user.tenantId, user.id, this.scope(user), id, evidenceId, dto, user.permissions); }

  @Post(':id/evidence/:evidenceId/custody')
  @Permissions(PermissionKeys.IncidentsEvidenceCustodyManage)
  createEvidenceCustody(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string, @Body() dto: Record<string, any>) { return this.incidents.createEvidenceCustody(user.tenantId, user.id, this.scope(user), id, evidenceId, dto, user.permissions); }

  @Get(':id/evidence/:evidenceId/preview')
  @Permissions(PermissionKeys.IncidentsEvidencePreview)
  previewEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string) { return this.incidents.evidenceAccess(user.tenantId, this.scope(user), id, evidenceId, user.permissions, 'preview'); }

  @Get(':id/evidence/:evidenceId/download')
  @Permissions(PermissionKeys.IncidentsEvidenceDownload)
  downloadEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('evidenceId') evidenceId: string) { return this.incidents.evidenceAccess(user.tenantId, this.scope(user), id, evidenceId, user.permissions, 'download'); }

  @Post(':id/evidence/review-request')
  @Permissions(PermissionKeys.IncidentsEvidenceReviewRequest)
  requestEvidenceReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestEvidenceReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/evidence/review-approve')
  @Permissions(PermissionKeys.IncidentsEvidenceReviewApprove)
  approveEvidenceReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideEvidenceReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/evidence/review-reject')
  @Permissions(PermissionKeys.IncidentsEvidenceReviewReject)
  rejectEvidenceReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideEvidenceReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/evidence/export-index')
  @Permissions(PermissionKeys.IncidentsEvidenceExportIndex)
  exportEvidenceIndex(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.exportEvidenceIndex(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/immediate-actions')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/immediate-actions/summary')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/immediate-actions/site-safety')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsSiteSafety(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'siteSafetyStatus'); }

  @Get(':id/immediate-actions/register')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsRegister(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'actionsRegister'); }

  @Get(':id/immediate-actions/emergency-response')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsEmergencyResponse(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'emergencyResponseActions'); }

  @Get(':id/immediate-actions/isolation-permit')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsIsolationPermit(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'isolationShutdownPermitControl'); }

  @Get(':id/immediate-actions/spill-release-fire')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsSpillReleaseFire(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'spillReleaseFireResponse'); }

  @Get(':id/immediate-actions/medical-response')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsMedicalResponse(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'firstAidMedicalImmediateResponse'); }

  @Get(':id/immediate-actions/temporary-controls')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsTemporaryControls(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'temporaryControls'); }

  @Get(':id/immediate-actions/restart-control')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsRestartControl(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'restartReturnToService'); }

  @Get(':id/immediate-actions/verification')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsVerification(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'verification'); }

  @Get(':id/immediate-actions/capa')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsCapa(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'convertToCapa'); }

  @Get(':id/immediate-actions/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  immediateActionsHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/immediate-actions/readiness')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/immediate-actions/context')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.immediateActionsContext(user.tenantId, this.scope(user), id, user.permissions); }

  @Patch(':id/immediate-actions/site-safety')
  @Permissions(PermissionKeys.IncidentsSiteSafetyVerify)
  updateImmediateSiteSafety(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateImmediateSiteSafety(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/immediate-actions/restart-control')
  @Permissions(PermissionKeys.IncidentsRestartControlManage)
  updateImmediateRestartControl(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateImmediateRestartControl(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/immediate-actions')
  @Permissions(PermissionKeys.IncidentsImmediateActionsEdit)
  createImmediateAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createImmediateAction(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/immediate-actions/:actionId')
  @Permissions(PermissionKeys.IncidentsImmediateActionsView)
  immediateActionDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string) { return this.incidents.immediateActionDetail(user.tenantId, this.scope(user), id, actionId, user.permissions); }

  @Patch(':id/immediate-actions/:actionId')
  @Permissions(PermissionKeys.IncidentsImmediateActionsEdit)
  updateImmediateAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.updateImmediateAction(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Delete(':id/immediate-actions/:actionId')
  @Permissions(PermissionKeys.IncidentsImmediateActionsDelete)
  deleteImmediateAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string) { return this.incidents.deleteImmediateAction(user.tenantId, user.id, this.scope(user), id, actionId, user.permissions); }

  @Post(':id/immediate-actions/:actionId/convert-capa')
  @Permissions(PermissionKeys.IncidentsCapaConvert)
  convertImmediateActionToCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.convertImmediateActionToCapa(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/complete')
  @Permissions(PermissionKeys.IncidentsImmediateActionsEdit)
  completeImmediateAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.completeImmediateAction(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/verify')
  @Permissions(PermissionKeys.IncidentsImmediateActionsVerify)
  verifyImmediateAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.verifyImmediateAction(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/reject-verification')
  @Permissions(PermissionKeys.IncidentsImmediateActionsVerify)
  rejectImmediateActionVerification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.rejectImmediateActionVerification(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/link-evidence')
  @Permissions(PermissionKeys.IncidentsEvidenceMappingManage)
  linkImmediateActionEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.linkImmediateActionEvidence(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/link-capa')
  @Permissions(PermissionKeys.IncidentsCapaConvert)
  linkImmediateActionCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.linkImmediateActionCapa(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/cancel')
  @Permissions(PermissionKeys.IncidentsImmediateActionsDelete)
  cancelImmediateAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.cancelImmediateAction(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/:actionId/create-followup-action')
  @Permissions(PermissionKeys.IncidentsFollowupsCreate)
  createImmediateActionFollowup(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body() dto: Record<string, any>) { return this.incidents.createImmediateActionFollowup(user.tenantId, user.id, this.scope(user), id, actionId, dto, user.permissions); }

  @Post(':id/immediate-actions/review-request')
  @Permissions(PermissionKeys.IncidentsImmediateActionsReviewRequest)
  requestImmediateActionsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestImmediateActionsReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/immediate-actions/review-approve')
  @Permissions(PermissionKeys.IncidentsImmediateActionsReviewApprove)
  approveImmediateActionsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideImmediateActionsReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/immediate-actions/review-reject')
  @Permissions(PermissionKeys.IncidentsImmediateActionsReviewReject)
  rejectImmediateActionsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideImmediateActionsReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/investigation-team')
  @Permissions(PermissionKeys.IncidentsTeamView)
  investigationTeam(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/team')
  @Permissions(PermissionKeys.IncidentsTeamView)
  team(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/team/summary')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/team/owner-lead')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamOwnerLead(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'ownerLead'); }

  @Patch(':id/team/owner-lead')
  @Permissions(PermissionKeys.IncidentsTeamOwnerAssign)
  updateTeamOwnerLead(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateTeamOwnerLead(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/team/members')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamMembers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'membersRegister'); }

  @Post(':id/investigation-team/members')
  @Permissions(PermissionKeys.IncidentsTeamEdit)
  createTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createTeamMember(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/team/members')
  @Permissions(PermissionKeys.IncidentsTeamMemberAdd)
  createTeamMemberAlias(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createTeamMember(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/team/members/:memberId')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamMemberDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string) { return this.incidents.teamMemberDetail(user.tenantId, this.scope(user), id, memberId, user.permissions); }

  @Patch(':id/investigation-team/members/:memberId')
  @Permissions(PermissionKeys.IncidentsTeamEdit)
  updateTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: Record<string, any>) { return this.incidents.updateTeamMember(user.tenantId, user.id, this.scope(user), id, memberId, dto, user.permissions); }

  @Patch(':id/team/members/:memberId')
  @Permissions(PermissionKeys.IncidentsTeamEdit)
  updateTeamMemberAlias(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: Record<string, any>) { return this.incidents.updateTeamMember(user.tenantId, user.id, this.scope(user), id, memberId, dto, user.permissions); }

  @Delete(':id/investigation-team/members/:memberId')
  @Permissions(PermissionKeys.IncidentsTeamDelete)
  deleteTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string) { return this.incidents.deleteTeamMember(user.tenantId, user.id, this.scope(user), id, memberId, user.permissions); }

  @Delete(':id/team/members/:memberId')
  @Permissions(PermissionKeys.IncidentsTeamMemberRemove)
  deleteTeamMemberAlias(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteTeamMember(user.tenantId, user.id, this.scope(user), id, memberId, user.permissions, dto); }

  @Post(':id/team/members/:memberId/accept')
  @Permissions(PermissionKeys.IncidentsTeamAcceptanceManage)
  acceptTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: Record<string, any>) { return this.incidents.setTeamMemberAcceptance(user.tenantId, user.id, this.scope(user), id, memberId, 'Accepted', dto, user.permissions); }

  @Post(':id/team/members/:memberId/decline')
  @Permissions(PermissionKeys.IncidentsTeamAcceptanceManage)
  declineTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: Record<string, any>) { return this.incidents.setTeamMemberAcceptance(user.tenantId, user.id, this.scope(user), id, memberId, 'Declined', dto, user.permissions); }

  @Post(':id/team/members/:memberId/replace')
  @Permissions(PermissionKeys.IncidentsTeamMemberReplace)
  replaceTeamMember(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: Record<string, any>) { return this.incidents.replaceTeamMember(user.tenantId, user.id, this.scope(user), id, memberId, dto, user.permissions); }

  @Post(':id/investigation-team/generate-required-roles')
  @Permissions(PermissionKeys.IncidentsTeamRequiredRolesGenerate)
  generateRequiredTeamRoles(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.generateRequiredTeamRoles(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Post(':id/team/generate-required-roles')
  @Permissions(PermissionKeys.IncidentsTeamRequiredRolesGenerate)
  generateRequiredTeamRolesAlias(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.generateRequiredTeamRoles(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/team/required-roles')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamRequiredRoles(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'requiredRolesMatrix'); }

  @Get(':id/team/acceptance')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamAcceptance(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'assignmentAcceptance'); }

  @Post(':id/team/send-invitations')
  @Permissions(PermissionKeys.IncidentsTeamNotificationsSend)
  sendTeamInvitations(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.sendTeamNotification(user.tenantId, user.id, this.scope(user), id, { ...dto, notificationType: 'Acceptance request' }, user.permissions); }

  @Post(':id/team/send-reminders')
  @Permissions(PermissionKeys.IncidentsTeamNotificationsSend)
  sendTeamReminders(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.sendTeamReminders(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/team/raci')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamRaci(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'raci'); }

  @Patch(':id/team/raci')
  @Permissions(PermissionKeys.IncidentsTeamRaciManage)
  updateTeamRaci(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateTeamRaci(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/team/competency-independence')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamCompetency(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'competencyTrainingIndependence'); }

  @Patch(':id/team/competency-independence')
  @Permissions(PermissionKeys.IncidentsTeamCompetencyManage)
  updateTeamCompetency(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateTeamMemberChecks(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/team/availability')
  @Permissions(PermissionKeys.IncidentsTeamView)
  teamAvailability(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.investigationTeamSection(user.tenantId, this.scope(user), id, user.permissions, 'availabilityConflictWorkload'); }

  @Patch(':id/team/availability')
  @Permissions(PermissionKeys.IncidentsTeamAvailabilityManage)
  updateTeamAvailability(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateTeamMemberChecks(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/team/user-search')
  @Permissions(PermissionKeys.IncidentsTeamView)
  searchTeamUsers(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.searchTeamUsers(user.tenantId, this.scope(user), id, dto, user.permissions); }

  @Post(':id/investigation-team/send-notification')
  @Permissions(PermissionKeys.IncidentsTeamNotificationsSend)
  sendTeamNotification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.sendTeamNotification(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/investigation-team/review-request')
  @Permissions(PermissionKeys.IncidentsTeamReviewRequest)
  requestTeamReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestTeamReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/investigation-team/review-approve')
  @Permissions(PermissionKeys.IncidentsTeamReviewApprove)
  approveTeamReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideTeamReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/investigation-team/review-reject')
  @Permissions(PermissionKeys.IncidentsTeamReviewReject)
  rejectTeamReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideTeamReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/rca')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rca(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/rca/summary')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/rca/prerequisites')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaPrerequisites(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'prerequisites'); }

  @Get(':id/rca/method')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaMethod(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'method'); }

  @Patch(':id/rca/method')
  @Permissions(PermissionKeys.IncidentsRcaMethodSelect)
  updateRcaMethod(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateRcaMethod(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/rca/causal-factors')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaCausalFactors(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'causalFactorsRegister'); }

  @Post(':id/rca/causal-factors')
  @Permissions(PermissionKeys.IncidentsRcaCausalFactorsCreate)
  createRcaCausalFactor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createRcaCausalFactor(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/rca/causal-factors/:factorId')
  @Permissions(PermissionKeys.IncidentsRcaCausalFactorsEdit)
  updateRcaCausalFactor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('factorId') factorId: string, @Body() dto: Record<string, any>) { return this.incidents.updateRcaCausalFactor(user.tenantId, user.id, this.scope(user), id, factorId, dto, user.permissions); }

  @Delete(':id/rca/causal-factors/:factorId')
  @Permissions(PermissionKeys.IncidentsRcaCausalFactorsDelete)
  deleteRcaCausalFactor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('factorId') factorId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteRcaCausalFactor(user.tenantId, user.id, this.scope(user), id, factorId, dto, user.permissions); }

  @Post(':id/rca/causal-factors/:factorId/confirm')
  @Permissions(PermissionKeys.IncidentsRcaCausalFactorsEdit)
  confirmRcaCausalFactor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('factorId') factorId: string, @Body() dto: Record<string, any>) { return this.incidents.decideRcaCausalFactor(user.tenantId, user.id, this.scope(user), id, factorId, 'Confirmed', dto, user.permissions); }

  @Post(':id/rca/causal-factors/:factorId/reject')
  @Permissions(PermissionKeys.IncidentsRcaCausalFactorsEdit)
  rejectRcaCausalFactor(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('factorId') factorId: string, @Body() dto: Record<string, any>) { return this.incidents.decideRcaCausalFactor(user.tenantId, user.id, this.scope(user), id, factorId, 'Rejected', dto, user.permissions); }

  @Post(':id/rca/causal-factors/:factorId/link-evidence')
  @Permissions(PermissionKeys.IncidentsRcaEvidenceMap)
  linkRcaCausalFactorEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('factorId') factorId: string, @Body() dto: Record<string, any>) { return this.incidents.linkRcaCausalFactorEvidence(user.tenantId, user.id, this.scope(user), id, factorId, dto, user.permissions); }

  @Post(':id/rca/causal-factors/:factorId/convert-root-cause')
  @Permissions(PermissionKeys.IncidentsRcaRootCausesCreate)
  convertRcaFactorToRootCause(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('factorId') factorId: string, @Body() dto: Record<string, any>) { return this.incidents.convertCausalFactorToRootCause(user.tenantId, user.id, this.scope(user), id, factorId, dto, user.permissions); }

  @Get(':id/rca/five-why')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaFiveWhy(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'fiveWhy'); }

  @Post(':id/rca/five-why/chains')
  @Permissions(PermissionKeys.IncidentsRcaEdit)
  upsertRcaFiveWhyChain(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_five_why_chains', dto, user.permissions); }

  @Post(':id/rca/five-why/steps')
  @Permissions(PermissionKeys.IncidentsRcaEdit)
  upsertRcaFiveWhyStep(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_five_why_steps', dto, user.permissions); }

  @Get(':id/rca/fishbone')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaFishbone(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'fishbone'); }

  @Post(':id/rca/fishbone/items')
  @Permissions(PermissionKeys.IncidentsRcaEdit)
  upsertRcaFishboneItem(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_fishbone_items', dto, user.permissions); }

  @Get(':id/rca/cause-tree')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaCauseTree(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'causeTree'); }

  @Post(':id/rca/cause-tree/nodes')
  @Permissions(PermissionKeys.IncidentsRcaEdit)
  upsertRcaCauseTreeNode(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_cause_tree_nodes', dto, user.permissions); }

  @Post(':id/rca/cause-tree/edges')
  @Permissions(PermissionKeys.IncidentsRcaEdit)
  upsertRcaCauseTreeEdge(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_cause_tree_edges', dto, user.permissions); }

  @Get(':id/rca/root-causes')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaRootCauses(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'rootCauseRegister'); }

  @Post(':id/rca/root-causes')
  @Permissions(PermissionKeys.IncidentsRcaRootCausesCreate)
  createRcaRootCause(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createRcaRootCause(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/rca/root-causes/:rootCauseId')
  @Permissions(PermissionKeys.IncidentsRcaRootCausesEdit)
  updateRcaRootCause(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('rootCauseId') rootCauseId: string, @Body() dto: Record<string, any>) { return this.incidents.updateRcaRootCause(user.tenantId, user.id, this.scope(user), id, rootCauseId, dto, user.permissions); }

  @Delete(':id/rca/root-causes/:rootCauseId')
  @Permissions(PermissionKeys.IncidentsRcaRootCausesDelete)
  deleteRcaRootCause(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('rootCauseId') rootCauseId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteRcaRootCause(user.tenantId, user.id, this.scope(user), id, rootCauseId, dto, user.permissions); }

  @Post(':id/rca/root-causes/:rootCauseId/create-capa')
  @Permissions(PermissionKeys.IncidentsRcaCreateCapa)
  createRcaCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('rootCauseId') rootCauseId: string, @Body() dto: Record<string, any>) { return this.incidents.createRcaCapaFromRootCause(user.tenantId, user.id, this.scope(user), id, rootCauseId, dto, user.permissions); }

  @Get(':id/rca/systemic-weaknesses')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaSystemicWeaknesses(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'systemicWeaknesses'); }

  @Post(':id/rca/systemic-weaknesses')
  @Permissions(PermissionKeys.IncidentsRcaEdit)
  upsertRcaSystemicWeakness(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_systemic_weaknesses', dto, user.permissions); }

  @Get(':id/rca/hypotheses')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaHypotheses(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'unsupportedAssumptions'); }

  @Post(':id/rca/hypotheses')
  @Permissions(PermissionKeys.IncidentsRcaHypothesesManage)
  upsertRcaHypothesis(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.upsertRcaSimpleRecord(user.tenantId, user.id, this.scope(user), id, 'incident_rca_hypotheses', dto, user.permissions); }

  @Get(':id/rca/evidence-mapping')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaEvidenceMapping(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'evidenceMappedCauses'); }

  @Get(':id/rca/quality-check')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaQualityCheck(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'qualityCheck'); }

  @Get(':id/rca/capa-preview')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaCapaPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'capaPreview'); }

  @Post(':id/rca/review-request')
  @Permissions(PermissionKeys.IncidentsRcaReviewRequest)
  requestRcaReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestRcaReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/rca/review-approve')
  @Permissions(PermissionKeys.IncidentsRcaReviewApprove)
  approveRcaReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideRcaReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/rca/review-reject')
  @Permissions(PermissionKeys.IncidentsRcaReviewReject)
  rejectRcaReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideRcaReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Post(':id/rca/complete')
  @Permissions(PermissionKeys.IncidentsRcaComplete)
  completeRca(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.completeOrReopenRca(user.tenantId, user.id, this.scope(user), id, 'Completed', dto, user.permissions); }

  @Post(':id/rca/reopen')
  @Permissions(PermissionKeys.IncidentsRcaReopen)
  reopenRca(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.completeOrReopenRca(user.tenantId, user.id, this.scope(user), id, 'Reopened', dto, user.permissions); }

  @Get(':id/rca/review')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Get(':id/rca/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  rcaHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/rca/readiness')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/rca/context')
  @Permissions(PermissionKeys.IncidentsRcaView)
  rcaContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.rcaTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/barriers')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/barriers/summary')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/barriers/readiness')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/barriers/register')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersRegister(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'barrierRegister'); }

  @Post(':id/barriers')
  @Permissions(PermissionKeys.IncidentsBarriersEdit)
  createBarrier(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createBarrier(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/barriers/import-from-lopa')
  @Permissions(PermissionKeys.IncidentsBarriersImport)
  importBarriersFromLopa(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.importBarriersFromSource(user.tenantId, user.id, this.scope(user), id, 'lopa', user.permissions); }

  @Post(':id/barriers/import-from-hazop')
  @Permissions(PermissionKeys.IncidentsBarriersImport)
  importBarriersFromHazop(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.importBarriersFromSource(user.tenantId, user.id, this.scope(user), id, 'hazop', user.permissions); }

  @Get(':id/barriers/demand-performance')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersDemandPerformance(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'demandPerformance'); }

  @Get(':id/barriers/failure-modes')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersFailureModes(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'failureModeAnalysis'); }

  @Get(':id/barriers/ipl-lopa-check')
  @Permissions(PermissionKeys.IncidentsBarriersIplView)
  barriersIplLopaCheck(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'iplLopaCreditCheck'); }

  @Get(':id/barriers/sis-sif')
  @Permissions(PermissionKeys.IncidentsBarriersSisSifView)
  barriersSisSif(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'sisSifInterlock'); }

  @Get(':id/barriers/psv-relief')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersPsvRelief(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'psvReliefDevice'); }

  @Get(':id/barriers/alarm-response')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersAlarmResponse(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'alarmOperatorResponse'); }

  @Get(':id/barriers/admin-controls')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersAdminControls(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'administrativeProcedurePtw'); }

  @Get(':id/barriers/ppe-emergency')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersPpeEmergency(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'ppeEmergencyResponseBarrier'); }

  @Get(':id/barriers/bowtie-map')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersBowtieMap(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'bowtieBarrierMap'); }

  @Get(':id/barriers/evidence-mapping')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersEvidenceMapping(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'evidenceMappedBarrier'); }

  @Get(':id/barriers/rca-linkage')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersRcaLinkage(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'rcaLinkage'); }

  @Get(':id/barriers/followups')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersFollowups(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'followupRequirements'); }

  @Post(':id/barriers/followups/create-action')
  @Permissions(PermissionKeys.IncidentsBarriersFollowupsCreate)
  createBarrierFollowupAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createBarrierFollowupAction(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/barriers/review')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Post(':id/barriers/review-request')
  @Permissions(PermissionKeys.IncidentsBarriersReviewRequest)
  requestBarrierReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestBarrierReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/barriers/review-approve')
  @Permissions(PermissionKeys.IncidentsBarriersReviewApprove)
  approveBarrierReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideBarrierReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/barriers/review-reject')
  @Permissions(PermissionKeys.IncidentsBarriersReviewReject)
  rejectBarrierReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideBarrierReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/barriers/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  barriersHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/barriers/context')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barriersContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.barrierLookupContext(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/barriers/:barrierId')
  @Permissions(PermissionKeys.IncidentsBarriersView)
  barrierDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('barrierId') barrierId: string) { return this.incidents.barrierDetail(user.tenantId, this.scope(user), id, barrierId); }

  @Patch(':id/barriers/:barrierId')
  @Permissions(PermissionKeys.IncidentsBarriersEdit)
  updateBarrier(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('barrierId') barrierId: string, @Body() dto: Record<string, any>) { return this.incidents.updateBarrier(user.tenantId, user.id, this.scope(user), id, barrierId, dto, user.permissions); }

  @Delete(':id/barriers/:barrierId')
  @Permissions(PermissionKeys.IncidentsBarriersDelete)
  deleteBarrier(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('barrierId') barrierId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteBarrier(user.tenantId, user.id, this.scope(user), id, barrierId, dto, user.permissions); }

  @Post(':id/barriers/:barrierId/link-evidence')
  @Permissions(PermissionKeys.IncidentsBarriersEvidenceMap)
  linkBarrierEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('barrierId') barrierId: string, @Body() dto: Record<string, any>) { return this.incidents.linkBarrierEvidence(user.tenantId, user.id, this.scope(user), id, barrierId, dto, user.permissions); }

  @Post(':id/barriers/:barrierId/link-rca')
  @Permissions(PermissionKeys.IncidentsBarriersRcaLink)
  linkBarrierRca(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('barrierId') barrierId: string, @Body() dto: Record<string, any>) { return this.incidents.linkBarrierRca(user.tenantId, user.id, this.scope(user), id, barrierId, dto, user.permissions); }

  @Get(':id/capa')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capa(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/capa/summary')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/capa/readiness')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/capa/register')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaRegister(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'capaRegister'); }

  @Post(':id/capa')
  @Permissions(PermissionKeys.IncidentsCapaCreate)
  createCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createCapaItem(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/capa/generate-from-rca')
  @Permissions(PermissionKeys.IncidentsCapaGenerate)
  generateCapaFromRca(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.generateCapaFromRca(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/capa/generate-from-barriers')
  @Permissions(PermissionKeys.IncidentsCapaGenerate)
  generateCapaFromBarriers(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.generateCapaFromBarriers(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/capa/source-mapping')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaSourceMapping(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'sourceMapping'); }

  @Get(':id/capa/coverage-matrix')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaCoverage(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'coverageMatrix'); }

  @Get(':id/capa/overdue-escalation')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaOverdueEscalation(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'overdueEscalation'); }

  @Get(':id/capa/review')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Post(':id/capa/request-review')
  @Permissions(PermissionKeys.IncidentsCapaReviewRequest)
  requestCapaReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestCapaReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/capa/approve-review')
  @Permissions(PermissionKeys.IncidentsCapaReviewApprove)
  approveCapaReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideCapaReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/capa/reject-review')
  @Permissions(PermissionKeys.IncidentsCapaReviewReject)
  rejectCapaReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideCapaReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/capa/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  capaHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/capa/context')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.capaLookupContext(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/capa/export')
  @Permissions(PermissionKeys.IncidentsCapaExport)
  exportCapa(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.exportCapa(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/capa/:capaId')
  @Permissions(PermissionKeys.IncidentsCapaView)
  capaDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string) { return this.incidents.capaDetail(user.tenantId, this.scope(user), id, capaId); }

  @Patch(':id/capa/:capaId')
  @Permissions(PermissionKeys.IncidentsCapaEdit)
  updateCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.updateCapaItem(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Delete(':id/capa/:capaId')
  @Permissions(PermissionKeys.IncidentsCapaDelete)
  deleteCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteCapaItem(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/link-source')
  @Permissions(PermissionKeys.IncidentsCapaLinkSource)
  linkCapaSource(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.linkCapaSource(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/link-evidence')
  @Permissions(PermissionKeys.IncidentsCapaLinkEvidence)
  linkCapaEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.linkCapaEvidence(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/submit-completion')
  @Permissions(PermissionKeys.IncidentsCapaComplete)
  submitCapaCompletion(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.submitCapaCompletion(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/accept-evidence')
  @Permissions(PermissionKeys.IncidentsCapaVerify)
  acceptCapaEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.decideCapaEvidence(user.tenantId, user.id, this.scope(user), id, capaId, true, dto, user.permissions); }

  @Post(':id/capa/:capaId/reject-evidence')
  @Permissions(PermissionKeys.IncidentsCapaVerify)
  rejectCapaEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.decideCapaEvidence(user.tenantId, user.id, this.scope(user), id, capaId, false, dto, user.permissions); }

  @Post(':id/capa/:capaId/verify-effectiveness')
  @Permissions(PermissionKeys.IncidentsCapaVerify)
  verifyCapaEffectiveness(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.verifyCapaEffectiveness(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/request-rework')
  @Permissions(PermissionKeys.IncidentsCapaVerify)
  requestCapaRework(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.requestCapaRework(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/escalate')
  @Permissions(PermissionKeys.IncidentsCapaEscalate)
  escalateCapa(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.escalateCapa(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Post(':id/capa/:capaId/link-existing-action')
  @Permissions(PermissionKeys.IncidentsActionsLink)
  linkExistingCapaAction(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('capaId') capaId: string, @Body() dto: Record<string, any>) { return this.incidents.linkExistingCapaAction(user.tenantId, user.id, this.scope(user), id, capaId, dto, user.permissions); }

  @Get(':id/linked-records')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/linked-records/summary')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/linked-records/readiness')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/linked-records/register')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordsRegister(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'linkedRecordsRegister'); }

  @Post(':id/linked-records')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsCreate)
  createLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createLinkedRecord(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/linked-records/auto-detect')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsAutoDetect)
  autoDetectLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.autoDetectLinkedRecords(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/linked-records/refresh-all-statuses')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsRefresh)
  refreshAllLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.refreshAllLinkedRecordStatuses(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/linked-records/required-links')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  requiredLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'requiredLinksReadiness'); }

  @Get(':id/linked-records/module-panels')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordModulePanels(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'modulePanels'); }

  @Get(':id/linked-records/source-generated')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordSourceGenerated(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'sourceGenerated'); }

  @Get(':id/linked-records/record-impacts')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordImpacts(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'recordImpacts'); }

  @Patch(':id/linked-records/record-impacts/:impactId')
  @Permissions(PermissionKeys.IncidentsRecordImpactsManage)
  updateLinkedRecordImpact(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('impactId') impactId: string, @Body() dto: Record<string, any>) { return this.incidents.updateRecordImpact(user.tenantId, user.id, this.scope(user), id, impactId, dto, user.permissions); }

  @Get(':id/linked-records/broken-stale')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordBrokenStale(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'brokenStale'); }

  @Get(':id/linked-records/actions-snapshot')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordActionsSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'actionsSnapshot'); }

  @Get(':id/linked-records/document-links')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordDocumentLinks(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'documentLinks'); }

  @Get(':id/linked-records/psm-review-links')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordPsmReviews(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'psmReviewLinks'); }

  @Post(':id/linked-records/create-followup-action')
  @Permissions(PermissionKeys.IncidentsFollowupsCreate)
  createLinkedRecordFollowup(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createLinkedRecordFollowupAction(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/linked-records/review')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordsReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Post(':id/linked-records/request-review')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsReviewRequest)
  requestLinkedRecordsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestLinkedRecordsReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/linked-records/approve-review')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsReviewApprove)
  approveLinkedRecordsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideLinkedRecordsReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/linked-records/reject-review')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsReviewReject)
  rejectLinkedRecordsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideLinkedRecordsReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/linked-records/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  linkedRecordsHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordsSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/linked-records/context')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.linkedRecordContext(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/linked-records/export')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsExport)
  exportLinkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.exportLinkedRecords(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsView)
  linkedRecordDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) { return this.incidents.linkedRecordDetail(user.tenantId, this.scope(user), id, linkId); }

  @Patch(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsEdit)
  updateLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) { return this.incidents.updateLinkedRecord(user.tenantId, user.id, this.scope(user), id, linkId, dto, user.permissions); }

  @Delete(':id/linked-records/:linkId')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsDelete)
  deleteLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteLinkedRecord(user.tenantId, user.id, this.scope(user), id, linkId, dto, user.permissions); }

  @Post(':id/linked-records/:linkId/refresh-status')
  @Permissions(PermissionKeys.IncidentsLinkedRecordsRefresh)
  refreshLinkedRecord(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('linkId') linkId: string) { return this.incidents.refreshLinkedRecordStatus(user.tenantId, user.id, this.scope(user), id, linkId, user.permissions); }

  @Get(':id/notifications-reporting')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  notificationsReporting(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/notifications-reporting/summary')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  notificationsReportingSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/notifications-reporting/readiness')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  notificationsReportingReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/notifications-reporting/determination')
  @Permissions(PermissionKeys.IncidentsReportingView)
  reportingDetermination(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'determination'); }

  @Post(':id/notifications-reporting/run-determination')
  @Permissions(PermissionKeys.IncidentsReportingDetermine)
  runReportingDetermination(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.runReportingDetermination(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/notifications-reporting/determination')
  @Permissions(PermissionKeys.IncidentsReportingOverride)
  updateReportingDetermination(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateReportingDetermination(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/notifications-reporting/notifications')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  internalNotifications(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'internalNotificationsRegister'); }

  @Post(':id/notifications-reporting/notifications')
  @Permissions(PermissionKeys.IncidentsNotificationsSend)
  createInternalNotification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createIncidentNotification(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/notifications-reporting/notifications/:notificationId/resend')
  @Permissions(PermissionKeys.IncidentsNotificationsResend)
  resendInternalNotification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('notificationId') notificationId: string, @Body() dto: Record<string, any>) { return this.incidents.resendIncidentNotification(user.tenantId, user.id, this.scope(user), id, notificationId, dto, user.permissions); }

  @Post(':id/notifications-reporting/notifications/:notificationId/acknowledge')
  @Permissions(PermissionKeys.IncidentsNotificationsAcknowledge)
  acknowledgeInternalNotification(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('notificationId') notificationId: string, @Body() dto: Record<string, any>) { return this.incidents.acknowledgeIncidentNotification(user.tenantId, user.id, this.scope(user), id, notificationId, dto, user.permissions); }

  @Get(':id/notifications-reporting/reports')
  @Permissions(PermissionKeys.IncidentsReportingView)
  regulatoryReports(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'regulatoryReportsRegister'); }

  @Post(':id/notifications-reporting/reports')
  @Permissions(PermissionKeys.IncidentsReportingEdit)
  createRegulatoryReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createRegulatoryReport(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/notifications-reporting/reports/:reportId')
  @Permissions(PermissionKeys.IncidentsReportingView)
  regulatoryReportDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string) { return this.incidents.regulatoryReportDetail(user.tenantId, this.scope(user), id, reportId); }

  @Patch(':id/notifications-reporting/reports/:reportId')
  @Permissions(PermissionKeys.IncidentsReportingEdit)
  updateRegulatoryReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.updateRegulatoryReport(user.tenantId, user.id, this.scope(user), id, reportId, dto, user.permissions); }

  @Post(':id/notifications-reporting/reports/:reportId/generate-package')
  @Permissions(PermissionKeys.IncidentsReportingGeneratePackage)
  generateRegulatoryPackage(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.generateReportPackage(user.tenantId, user.id, this.scope(user), id, reportId, dto, user.permissions); }

  @Post(':id/notifications-reporting/reports/:reportId/request-approval')
  @Permissions(PermissionKeys.IncidentsReportingReviewRequest)
  requestRegulatoryApproval(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.requestReportApproval(user.tenantId, user.id, this.scope(user), id, reportId, dto, user.permissions); }

  @Post(':id/notifications-reporting/reports/:reportId/mark-submitted')
  @Permissions(PermissionKeys.IncidentsReportingSubmit)
  markRegulatorySubmitted(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.markReportSubmitted(user.tenantId, user.id, this.scope(user), id, reportId, dto, user.permissions); }

  @Post(':id/notifications-reporting/reports/:reportId/add-acknowledgement')
  @Permissions(PermissionKeys.IncidentsReportingAcknowledge)
  addRegulatoryAcknowledgement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.addReportAcknowledgement(user.tenantId, user.id, this.scope(user), id, reportId, dto, user.permissions); }

  @Post(':id/notifications-reporting/reports/:reportId/mark-rejected')
  @Permissions(PermissionKeys.IncidentsReportingSubmit)
  markRegulatoryRejected(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.markReportRejected(user.tenantId, user.id, this.scope(user), id, reportId, dto, user.permissions); }

  @Get(':id/notifications-reporting/reportability-criteria')
  @Permissions(PermissionKeys.IncidentsReportingView)
  reportabilityCriteria(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'reportabilityCriteria'); }

  @Get(':id/notifications-reporting/deadlines')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  reportingDeadlines(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'deadlines'); }

  @Get(':id/notifications-reporting/package-checklist')
  @Permissions(PermissionKeys.IncidentsReportingView)
  reportingPackageChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'packageChecklist'); }

  @Get(':id/notifications-reporting/stakeholders')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  externalStakeholders(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'externalStakeholders'); }

  @Post(':id/notifications-reporting/stakeholders')
  @Permissions(PermissionKeys.IncidentsNotificationsSend)
  createExternalStakeholder(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createExternalStakeholderNotification(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/notifications-reporting/management-legal-insurance')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  managementLegalInsurance(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'managementLegalInsurance'); }

  @Post(':id/notifications-reporting/create-followup-action')
  @Permissions(PermissionKeys.IncidentsFollowupsCreate)
  createReportingFollowup(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createReportingFollowupAction(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/notifications-reporting/review')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  reportingReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Post(':id/notifications-reporting/request-review')
  @Permissions(PermissionKeys.IncidentsReportingReviewRequest)
  requestReportingReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestReportingReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/notifications-reporting/approve-review')
  @Permissions(PermissionKeys.IncidentsReportingReviewApprove)
  approveReportingReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideReportingReview(user.tenantId, user.id, this.scope(user), id, 'Approved', dto, user.permissions); }

  @Post(':id/notifications-reporting/reject-review')
  @Permissions(PermissionKeys.IncidentsReportingReviewReject)
  rejectReportingReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.decideReportingReview(user.tenantId, user.id, this.scope(user), id, 'Rejected', dto, user.permissions); }

  @Get(':id/notifications-reporting/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  reportingHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/notifications-reporting/context')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  reportingContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/notifications-reporting/export-log')
  @Permissions(PermissionKeys.IncidentsReportingExport)
  exportReportingLog(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.exportReportingLog(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/lookups/notification-recipients')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  notificationRecipientsLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.users); }

  @Get(':id/lookups/regulatory-config')
  @Permissions(PermissionKeys.IncidentsReportingView)
  regulatoryConfigLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.notificationsReportingSection(user.tenantId, this.scope(user), id, user.permissions, 'determination'); }

  @Get(':id/lookups/jurisdictions')
  @Permissions(PermissionKeys.IncidentsReportingView)
  jurisdictionsLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.jurisdictions); }

  @Get(':id/lookups/agencies')
  @Permissions(PermissionKeys.IncidentsReportingView)
  agenciesLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.agencies); }

  @Get(':id/lookups/report-templates')
  @Permissions(PermissionKeys.IncidentsReportingView)
  reportTemplatesLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.reportTemplates); }

  @Get(':id/lookups/evidence')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  reportingEvidenceLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.evidence); }

  @Get(':id/lookups/documents')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  reportingDocumentsLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.documents); }

  @Get(':id/lookups/actions')
  @Permissions(PermissionKeys.IncidentsNotificationsReportingView)
  reportingActionsLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reportingContext(user.tenantId, this.scope(user), id, user.permissions).then((context: any) => context.actions); }

  @Get(':id/review-approval')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewApproval(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/review-approval/summary')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewApprovalSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/review-approval/readiness')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewApprovalReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Post(':id/review-approval/run-readiness-check')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  runReviewReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.runReviewReadinessCheck(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/review-approval/section-checklist')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewSectionChecklist(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'sectionChecklist'); }

  @Get(':id/review-approval/workflow')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'workflow'); }

  @Post(':id/review-approval/start-workflow')
  @Permissions(PermissionKeys.IncidentsReviewApprovalStartWorkflow)
  startReviewWorkflow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.startReviewWorkflow(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/review-approval/reviewers')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewReviewers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'reviewers'); }

  @Post(':id/review-approval/reviewers')
  @Permissions(PermissionKeys.IncidentsReviewApprovalAddReviewer)
  addReviewReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createReviewReviewer(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/review-approval/reviewers/:reviewerId')
  @Permissions(PermissionKeys.IncidentsReviewApprovalEditReviewer)
  updateReviewReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.updateReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, dto, user.permissions); }

  @Delete(':id/review-approval/reviewers/:reviewerId')
  @Permissions(PermissionKeys.IncidentsReviewApprovalRemoveReviewer)
  removeReviewReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.removeReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, dto, user.permissions); }

  @Post(':id/review-approval/reviewers/:reviewerId/request')
  @Permissions(PermissionKeys.IncidentsReviewApprovalStartWorkflow)
  requestReviewerApproval(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.requestReviewApprovalForReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, dto, user.permissions); }

  @Post(':id/review-approval/reviewers/:reviewerId/approve')
  @Permissions(PermissionKeys.IncidentsReviewApprovalApprove)
  approveReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.decideReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, 'Approved', dto, user.permissions); }

  @Post(':id/review-approval/reviewers/:reviewerId/reject')
  @Permissions(PermissionKeys.IncidentsReviewApprovalReject)
  rejectReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.decideReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, 'Rejected', dto, user.permissions); }

  @Post(':id/review-approval/reviewers/:reviewerId/request-changes')
  @Permissions(PermissionKeys.IncidentsReviewApprovalRequestChanges)
  requestReviewerChanges(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.decideReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, 'Changes requested', dto, user.permissions); }

  @Post(':id/review-approval/reviewers/:reviewerId/delegate')
  @Permissions(PermissionKeys.IncidentsReviewApprovalDelegate)
  delegateReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.delegateReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, dto, user.permissions); }

  @Post(':id/review-approval/reviewers/:reviewerId/escalate')
  @Permissions(PermissionKeys.IncidentsReviewApprovalEscalate)
  escalateReviewer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reviewerId') reviewerId: string, @Body() dto: Record<string, any>) { return this.incidents.escalateReviewReviewer(user.tenantId, user.id, this.scope(user), id, reviewerId, dto, user.permissions); }

  @Get(':id/review-approval/decisions')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewDecisions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'decisions'); }

  @Get(':id/review-approval/e-signatures')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewSignatures(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'eSignatures'); }

  @Post(':id/review-approval/e-sign')
  @Permissions(PermissionKeys.IncidentsReviewApprovalESign)
  eSignReviewApproval(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.eSignReviewApproval(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/review-approval/blockers')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewBlockers(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'blockers'); }

  @Post(':id/review-approval/blockers/:blockerId/override')
  @Permissions(PermissionKeys.IncidentsReviewApprovalOverrideBlocker)
  overrideReviewBlocker(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('blockerId') blockerId: string, @Body() dto: Record<string, any>) { return this.incidents.overrideReviewBlocker(user.tenantId, user.id, this.scope(user), id, blockerId, dto, user.permissions); }

  @Get(':id/review-approval/change-requests')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewChangeRequests(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'changeRequests'); }

  @Post(':id/review-approval/change-requests')
  @Permissions(PermissionKeys.IncidentsReviewApprovalRequestChanges)
  createReviewChangeRequest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createReviewChangeRequest(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Patch(':id/review-approval/change-requests/:requestId')
  @Permissions(PermissionKeys.IncidentsReviewApprovalRequestChanges)
  updateReviewChangeRequest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requestId') requestId: string, @Body() dto: Record<string, any>) { return this.incidents.updateReviewChangeRequest(user.tenantId, user.id, this.scope(user), id, requestId, dto, user.permissions); }

  @Post(':id/review-approval/change-requests/:requestId/resolve')
  @Permissions(PermissionKeys.IncidentsReviewApprovalRequestChanges)
  resolveReviewChangeRequest(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('requestId') requestId: string, @Body() dto: Record<string, any>) { return this.incidents.resolveReviewChangeRequest(user.tenantId, user.id, this.scope(user), id, requestId, dto, user.permissions); }

  @Get(':id/review-approval/closure')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewClosure(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'closure'); }

  @Post(':id/review-approval/request-closure')
  @Permissions(PermissionKeys.IncidentsReviewApprovalRequestClosure)
  requestReviewClosure(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.requestIncidentClosureFromReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/review-approval/approve-closure')
  @Permissions(PermissionKeys.IncidentsReviewApprovalApprove)
  approveReviewClosure(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.approveIncidentClosureFromReview(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/review-approval/close')
  @Permissions(PermissionKeys.IncidentsReviewApprovalClose)
  closeFromReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.closeIncidentFromReviewApproval(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/review-approval/reopen')
  @Permissions(PermissionKeys.IncidentsReviewApprovalReopen)
  reopenFromReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reopenIncidentFromReviewApproval(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/review-approval/history')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewApprovalHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/review-approval/context')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewApprovalContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'context'); }

  @Get(':id/lookups/reviewers')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewReviewersLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'context').then((context: any) => context.users); }

  @Get(':id/lookups/workflow-config')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewWorkflowConfigLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'context').then((context: any) => context.workflowConfig); }

  @Get(':id/lookups/approval-roles')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewRolesLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'context').then((context: any) => context.approvalRoles); }

  @Get(':id/lookups/e-signature-meanings')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewSignatureMeaningsLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'context').then((context: any) => context.signatureMeanings); }

  @Get(':id/lookups/blockers')
  @Permissions(PermissionKeys.IncidentsReviewApprovalView)
  reviewBlockersLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.reviewApprovalSection(user.tenantId, this.scope(user), id, user.permissions, 'blockers'); }

  @Get(':id/lessons')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessons(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/lessons/summary')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/lessons/readiness')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Get(':id/lessons/register')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsRegister(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'lessonsRegister'); }

  @Post(':id/lessons')
  @Permissions(PermissionKeys.IncidentsLessonsCreate)
  createLesson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createLesson(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/lessons/source-mapping')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsSourceMapping(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'sourceMapping'); }

  @Get(':id/lessons/applicability')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsApplicability(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'applicability'); }

  @Get(':id/lessons/acknowledgements')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsAcknowledgements(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'acknowledgements'); }

  @Get(':id/lessons/review')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Get(':id/lessons/history')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/lessons/context')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonsContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'context'); }

  @Post(':id/lessons/generate-from-rca-capa')
  @Permissions(PermissionKeys.IncidentsLessonsGenerate)
  generateLessons(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.generateLessonsFromRcaCapa(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/lessons/:lessonId')
  @Permissions(PermissionKeys.IncidentsLessonsView)
  lessonDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('lessonId') lessonId: string) { return this.incidents.lessonsSection(user.tenantId, this.scope(user), id, user.permissions, 'lessonsRegister').then((rows: any[]) => rows.find((row) => row.id === lessonId)); }

  @Patch(':id/lessons/:lessonId')
  @Permissions(PermissionKeys.IncidentsLessonsEdit)
  updateLesson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('lessonId') lessonId: string, @Body() dto: Record<string, any>) { return this.incidents.updateLesson(user.tenantId, user.id, this.scope(user), id, lessonId, dto, user.permissions); }

  @Delete(':id/lessons/:lessonId')
  @Permissions(PermissionKeys.IncidentsLessonsDelete)
  deleteLesson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('lessonId') lessonId: string, @Body() dto: Record<string, any>) { return this.incidents.deleteLesson(user.tenantId, user.id, this.scope(user), id, lessonId, dto ?? {}, user.permissions); }

  @Post(':id/lessons/:lessonId/link-source')
  @Permissions(PermissionKeys.IncidentsLessonsEdit)
  linkLessonSource(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('lessonId') lessonId: string, @Body() dto: Record<string, any>) { return this.incidents.linkLessonSource(user.tenantId, user.id, this.scope(user), id, lessonId, dto, user.permissions); }

  @Post(':id/lessons/:lessonId/distribute')
  @Permissions(PermissionKeys.IncidentsLessonsDistribute)
  distributeLesson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('lessonId') lessonId: string, @Body() dto: Record<string, any>) { return this.incidents.distributeLesson(user.tenantId, user.id, this.scope(user), id, lessonId, dto, user.permissions); }

  @Post(':id/lessons/:lessonId/verify')
  @Permissions(PermissionKeys.IncidentsLessonsVerify)
  verifyLesson(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('lessonId') lessonId: string, @Body() dto: Record<string, any>) { return this.incidents.verifyLesson(user.tenantId, user.id, this.scope(user), id, lessonId, dto, user.permissions); }

  @Post(':id/lessons/request-review')
  @Permissions(PermissionKeys.IncidentsLessonsReviewRequest)
  requestLessonsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reviewLessons(user.tenantId, user.id, this.scope(user), id, dto, user.permissions, 'request'); }

  @Post(':id/lessons/approve-review')
  @Permissions(PermissionKeys.IncidentsLessonsReviewApprove)
  approveLessonsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reviewLessons(user.tenantId, user.id, this.scope(user), id, dto, user.permissions, 'approve'); }

  @Post(':id/lessons/reject-review')
  @Permissions(PermissionKeys.IncidentsLessonsReviewReject)
  rejectLessonsReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reviewLessons(user.tenantId, user.id, this.scope(user), id, dto, user.permissions, 'reject'); }

  @Get(':id/history')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentHistoryTab(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) { return this.incidents.historyTab(user.tenantId, this.scope(user), id, user.permissions, query); }

  @Get(':id/history/summary')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentHistorySummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/history/events')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentHistoryEvents(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'events', query); }

  @Get(':id/history/status-transitions')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentStatusTransitions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'statusTransitions'); }

  @Get(':id/history/diff/:eventId')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentHistoryDiff(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('eventId') eventId: string) { return this.incidents.historyDiffById(user.tenantId, this.scope(user), id, eventId, user.permissions); }

  @Get(':id/history/review-approval')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentReviewApprovalHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'reviewApproval'); }

  @Get(':id/history/evidence')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentEvidenceHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'evidence'); }

  @Get(':id/history/actions')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentActionHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'actions'); }

  @Get(':id/history/notifications-reporting')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentNotificationHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'notifications'); }

  @Get(':id/history/access')
  @Permissions(PermissionKeys.IncidentsAccessHistoryView)
  incidentAccessHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'access'); }

  @Get(':id/history/export')
  @Permissions(PermissionKeys.IncidentsHistoryExport)
  exportIncidentHistory(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query() query: Record<string, any>) { return this.incidents.exportHistory(user.tenantId, user.id, this.scope(user), id, user.permissions, query); }

  @Get(':id/history/context')
  @Permissions(PermissionKeys.IncidentsHistoryView)
  incidentHistoryContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.historySection(user.tenantId, this.scope(user), id, user.permissions, 'context'); }

  @Get(':id/final-report')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportTab(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportTab(user.tenantId, this.scope(user), id, user.permissions); }

  @Get(':id/final-report/summary')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'summaryCards'); }

  @Get(':id/final-report/readiness')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportReadiness(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'readiness'); }

  @Post(':id/final-report/run-readiness-check')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  runFinalReportReadinessCheck(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.runFinalReportReadinessCheck(user.tenantId, user.id, this.scope(user), id, user.permissions, dto ?? {}); }

  @Get(':id/final-report/templates')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportTemplates(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'templates'); }

  @Post(':id/final-report/select-template')
  @Permissions(PermissionKeys.IncidentsFinalReportConfigure)
  selectFinalReportTemplate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.selectFinalReportTemplate(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Get(':id/final-report/sections')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportSections(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'sectionBuilder'); }

  @Patch(':id/final-report/sections')
  @Permissions(PermissionKeys.IncidentsFinalReportConfigure)
  updateFinalReportSections(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateFinalReportSections(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/final-report/create-snapshot')
  @Permissions(PermissionKeys.IncidentsFinalReportGenerate)
  createFinalReportSnapshot(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.createFinalReportSnapshot(user.tenantId, user.id, this.scope(user), id, dto ?? {}, user.permissions); }

  @Get(':id/final-report/preview')
  @Permissions(PermissionKeys.IncidentsFinalReportPreview)
  finalReportPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'preview'); }

  @Get(':id/final-report/redaction-preview')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportRedactionPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'redactionPreview'); }

  @Get(':id/final-report/appendices')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportAppendices(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'appendices'); }

  @Patch(':id/final-report/appendices')
  @Permissions(PermissionKeys.IncidentsFinalReportConfigure)
  updateFinalReportAppendices(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.updateFinalReportSections(user.tenantId, user.id, this.scope(user), id, { ...dto, reason: dto?.reason ?? 'Appendices updated' }, user.permissions); }

  @Get(':id/final-report/reports')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportsRegister(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'generatedReports'); }

  @Post(':id/final-report/generate')
  @Permissions(PermissionKeys.IncidentsFinalReportGenerate)
  generateFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.generateFinalReport(user.tenantId, user.id, this.scope(user), id, dto ?? {}, user.permissions); }

  @Get(':id/final-report/reports/:reportId')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportDetail(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'generatedReports').then((rows: any[]) => rows.find((row) => row.id === reportId)); }

  @Get(':id/final-report/reports/:reportId/preview')
  @Permissions(PermissionKeys.IncidentsFinalReportPreview)
  finalReportDetailPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'preview'); }

  @Get(':id/final-report/reports/:reportId/download')
  @Permissions(PermissionKeys.IncidentsFinalReportDownload)
  downloadFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string) { return this.incidents.exportFinalReport(user.tenantId, user.id, this.scope(user), id, 'download', { reportId, reason: 'Report download requested' }, user.permissions); }

  @Post(':id/final-report/reports/:reportId/mark-official')
  @Permissions(PermissionKeys.IncidentsFinalReportMarkOfficial)
  markFinalReportOfficial(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.markFinalReportOfficial(user.tenantId, user.id, this.scope(user), id, reportId, dto ?? {}, user.permissions); }

  @Post(':id/final-report/reports/:reportId/publish')
  @Permissions(PermissionKeys.IncidentsFinalReportPublish)
  publishFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.publishFinalReport(user.tenantId, user.id, this.scope(user), id, reportId, dto ?? {}, user.permissions); }

  @Post(':id/final-report/reports/:reportId/supersede')
  @Permissions(PermissionKeys.IncidentsFinalReportSupersede)
  supersedeFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.archiveFinalReport(user.tenantId, user.id, this.scope(user), id, reportId, { ...dto, status: 'Superseded' }, user.permissions); }

  @Post(':id/final-report/reports/:reportId/archive')
  @Permissions(PermissionKeys.IncidentsFinalReportArchive)
  archiveFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('reportId') reportId: string, @Body() dto: Record<string, any>) { return this.incidents.archiveFinalReport(user.tenantId, user.id, this.scope(user), id, reportId, dto ?? {}, user.permissions); }

  @Get(':id/final-report/version-history')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportVersionHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'versionHistory'); }

  @Get(':id/final-report/download-log')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportDownloadLog(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'downloadLog'); }

  @Get(':id/final-report/review')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportReview(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'review'); }

  @Post(':id/final-report/request-review')
  @Permissions(PermissionKeys.IncidentsFinalReportReviewRequest)
  requestFinalReportReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reviewFinalReport(user.tenantId, user.id, this.scope(user), id, dto ?? {}, user.permissions, 'request'); }

  @Post(':id/final-report/approve-review')
  @Permissions(PermissionKeys.IncidentsFinalReportReviewApprove)
  approveFinalReportReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reviewFinalReport(user.tenantId, user.id, this.scope(user), id, dto ?? {}, user.permissions, 'approve'); }

  @Post(':id/final-report/reject-review')
  @Permissions(PermissionKeys.IncidentsFinalReportReviewReject)
  rejectFinalReportReview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reviewFinalReport(user.tenantId, user.id, this.scope(user), id, dto ?? {}, user.permissions, 'reject'); }

  @Get(':id/final-report/history')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'changeHistory'); }

  @Get(':id/final-report/context')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportContext(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'context'); }

  @Post(':id/final-report/export/:exportType')
  @Permissions(PermissionKeys.IncidentsFinalReportExport)
  exportFinalReport(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('exportType') exportType: string, @Body() dto: Record<string, any>) { return this.incidents.exportFinalReport(user.tenantId, user.id, this.scope(user), id, exportType, dto ?? {}, user.permissions); }

  @Get(':id/lookups/report-templates')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportTemplateLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'templates'); }

  @Get(':id/lookups/redaction-profiles')
  @Permissions(PermissionKeys.IncidentsFinalReportView)
  finalReportRedactionLookup(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.finalReportSection(user.tenantId, this.scope(user), id, user.permissions, 'context').then((context: any) => context.redactionProfiles); }

  @Get(':id/quick-actions')
  @Permissions(PermissionKeys.IncidentsDetailView)
  quickActions(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.quickActions(user.tenantId, this.scope(user), id, user.permissions); }

  @Patch(':id/owner')
  @Permissions(PermissionKeys.IncidentsAssign)
  assignOwner(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.assignOwner(user.tenantId, user.id, this.scope(user), id, dto); }

  @Post(':id/status')
  @Permissions(PermissionKeys.IncidentsStatusChange)
  changeStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.changeStatus(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/close')
  @Permissions(PermissionKeys.IncidentsClose)
  closeIncident(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.closeIncident(user.tenantId, user.id, this.scope(user), id, dto, user.permissions); }

  @Post(':id/reopen')
  @Permissions(PermissionKeys.IncidentsReopen)
  reopenIncident(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Record<string, any>) { return this.incidents.reopenIncident(user.tenantId, user.id, this.scope(user), id, dto); }

  @Get(':id/export-summary')
  @Permissions(PermissionKeys.IncidentsExportSummary)
  exportSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.exportSummary(user.tenantId, user.id, this.scope(user), id, user.permissions); }

  @Get(':id/register-summary')
  @Permissions(PermissionKeys.IncidentsRegisterView)
  registerSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.register(user.tenantId, this.scope(user), { id, limit: 1 }, user.permissions); }

  @Get(':id')
  @Permissions(PermissionKeys.IncidentsDetailView)
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.incidents.detail(user.tenantId, this.scope(user), id, user.permissions); }

  private scope(user: RequestUser): { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean } {
    const scope: { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean } = {};
    if (user.siteIds) scope.allowedSiteIds = user.siteIds;
    if (user.selectedSiteId !== undefined) scope.selectedSiteId = user.selectedSiteId;
    if (user.corporateView !== undefined) scope.corporateView = user.corporateView;
    return scope;
  }
}
