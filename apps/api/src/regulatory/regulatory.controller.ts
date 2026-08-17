import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { RegulatoryService } from './regulatory.service';

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('regulatory')
export class RegulatoryController {
  constructor(private readonly regulatory: RegulatoryService) {}

  @Get()
  @Permissions('regulatory.register.view')
  root(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.register(this.scope(user), query);
  }

  @Get('dashboard')
  @Permissions('regulatory.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboard(user.id, this.scope(user), query);
  }

  @Get('dashboard/summary')
  @Permissions('regulatory.dashboard.view')
  dashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboardSummary(this.scope(user), query);
  }

  @Get('dashboard/by-jurisdiction')
  @Permissions('regulatory.dashboard.view')
  byJurisdiction(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboardGroup(this.scope(user), 'jurisdiction_level', query);
  }

  @Get('dashboard/by-site')
  @Permissions('regulatory.dashboard.view')
  bySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboardGroup(this.scope(user), 'site_id', query);
  }

  @Get('dashboard/by-unit')
  @Permissions('regulatory.dashboard.view')
  byUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboardGroup(this.scope(user), 'unit_id', query);
  }

  @Get('dashboard/by-category')
  @Permissions('regulatory.dashboard.view')
  byCategory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboardGroup(this.scope(user), 'category', query);
  }

  @Get('dashboard/by-criticality')
  @Permissions('regulatory.dashboard.view')
  byCriticality(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.dashboardGroup(this.scope(user), 'criticality', query);
  }

  @Get('dashboard/review-due')
  @Permissions('regulatory.dashboard.view')
  reviewDue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.filteredView(this.scope(user), 'overdue-review', query);
  }

  @Get('dashboard/effective-soon')
  @Permissions('regulatory.dashboard.view')
  effectiveSoon(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.filteredView(this.scope(user), 'effective-soon', query);
  }

  @Get('dashboard/missing-owner')
  @Permissions('regulatory.dashboard.view')
  missingOwner(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.filteredView(this.scope(user), 'missing-owner', query);
  }

  @Get('dashboard/missing-applicability')
  @Permissions('regulatory.dashboard.view')
  missingApplicability(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.filteredView(this.scope(user), 'missing-applicability', query);
  }

  @Get('dashboard/recent')
  @Permissions('regulatory.dashboard.view')
  recent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.register(this.scope(user), { ...query, sort: 'updated_at.desc', limit: query.limit ?? 10 });
  }

  @Get('register')
  @Permissions('regulatory.register.view')
  register(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.register(this.scope(user), query);
  }

  @Get('summary')
  @Permissions('regulatory.register.view')
  summary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.summary(this.scope(user), query);
  }

  @Post()
  @Permissions('regulatory.item.create')
  create(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.create(user.id, this.scope(user), dto, user.permissions);
  }

  @Get('jurisdictions/dashboard')
  @Permissions('regulatory.jurisdiction.dashboard.view')
  jurisdictionDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.jurisdictionDashboard(this.scope(user), query); }

  @Get('jurisdictions/dashboard/summary')
  @Permissions('regulatory.jurisdiction.dashboard.view')
  jurisdictionDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.jurisdictionDashboard(this.scope(user), query).then((data) => data.summary); }

  @Get('jurisdictions/register')
  @Permissions('regulatory.jurisdiction.view')
  jurisdictionRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.jurisdictionRegister(this.scope(user), query); }

  @Get('jurisdictions')
  @Permissions('regulatory.jurisdiction.view')
  jurisdictions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.jurisdictions(this.scope(user), query);
  }

  @Post('jurisdictions')
  @Permissions('regulatory.jurisdiction.create')
  createJurisdiction(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.createJurisdiction(user.id, this.scope(user), dto, user.permissions);
  }

  @Get('jurisdictions/:jurisdictionId')
  @Permissions('regulatory.jurisdiction.view')
  jurisdictionDetail(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string) { return this.regulatory.getJurisdiction(this.scope(user), jurisdictionId); }

  @Patch('jurisdictions/:jurisdictionId')
  @Permissions('regulatory.jurisdiction.edit')
  updateJurisdiction(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateJurisdiction(user.id, this.scope(user), jurisdictionId, dto, user.permissions); }

  @Post('jurisdictions/:jurisdictionId/archive')
  @Permissions('regulatory.jurisdiction.archive')
  archiveJurisdiction(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveJurisdiction(user.id, this.scope(user), jurisdictionId, dto, user.permissions); }

  @Post('jurisdictions/:jurisdictionId/reactivate')
  @Permissions('regulatory.jurisdiction.reactivate')
  reactivateJurisdiction(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string, @Body() dto: Record<string, any>) { return this.regulatory.reactivateJurisdiction(user.id, this.scope(user), jurisdictionId, dto, user.permissions); }

  @Get('jurisdictions/:jurisdictionId/authorities')
  @Permissions('regulatory.authority.view')
  jurisdictionAuthorities(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string) { return this.regulatory.jurisdictionAuthorities(this.scope(user), jurisdictionId); }

  @Get('jurisdictions/:jurisdictionId/sites')
  @Permissions('regulatory.jurisdiction.view')
  jurisdictionSites(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string) { return this.regulatory.jurisdictionSites(this.scope(user), jurisdictionId); }

  @Get('jurisdictions/:jurisdictionId/register-items')
  @Permissions('regulatory.register.view')
  jurisdictionRegisterItems(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string) { return this.regulatory.jurisdictionRegisterItems(this.scope(user), jurisdictionId); }

  @Get('jurisdictions/:jurisdictionId/applicability')
  @Permissions('regulatory.applicability.view')
  jurisdictionApplicability(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string) { return this.regulatory.jurisdictionApplicability(this.scope(user), jurisdictionId); }

  @Get('jurisdictions/:jurisdictionId/history')
  @Permissions('regulatory.history.view')
  jurisdictionHistory(@CurrentUser() user: RequestUser, @Param('jurisdictionId') jurisdictionId: string) { return this.regulatory.jurisdictionHistory(this.scope(user), jurisdictionId); }

  @Get('authorities')
  @Permissions('regulatory.authority.view')
  authorities(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.authorities(this.scope(user), query); }

  @Post('authorities')
  @Permissions('regulatory.authority.create')
  createAuthority(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createAuthority(user.id, this.scope(user), dto, user.permissions); }

  @Get('authorities/:authorityId')
  @Permissions('regulatory.authority.view')
  authorityDetail(@CurrentUser() user: RequestUser, @Param('authorityId') authorityId: string) { return this.regulatory.getAuthority(this.scope(user), authorityId); }

  @Patch('authorities/:authorityId')
  @Permissions('regulatory.authority.edit')
  updateAuthority(@CurrentUser() user: RequestUser, @Param('authorityId') authorityId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateAuthority(user.id, this.scope(user), authorityId, dto, user.permissions); }

  @Post('authorities/:authorityId/archive')
  @Permissions('regulatory.authority.archive')
  archiveAuthority(@CurrentUser() user: RequestUser, @Param('authorityId') authorityId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveAuthority(user.id, this.scope(user), authorityId, dto, user.permissions); }

  @Post('authorities/:authorityId/reactivate')
  @Permissions('regulatory.authority.edit')
  reactivateAuthority(@CurrentUser() user: RequestUser, @Param('authorityId') authorityId: string, @Body() dto: Record<string, any>) { return this.regulatory.reactivateAuthority(user.id, this.scope(user), authorityId, dto, user.permissions); }

  @Get('authorities/:authorityId/register-items')
  @Permissions('regulatory.register.view')
  authorityRegisterItems(@CurrentUser() user: RequestUser, @Param('authorityId') authorityId: string) { return this.regulatory.authorityRegisterItems(this.scope(user), authorityId); }

  @Get('authorities/:authorityId/history')
  @Permissions('regulatory.history.view')
  authorityHistory(@CurrentUser() user: RequestUser, @Param('authorityId') authorityId: string) { return this.regulatory.authorityHistory(this.scope(user), authorityId); }

  @Post('jurisdiction-authorities')
  @Permissions('regulatory.authority.link')
  linkAuthority(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.linkAuthorityToJurisdiction(user.id, this.scope(user), dto, user.permissions); }

  @Delete('jurisdiction-authorities/:linkId')
  @Permissions('regulatory.authority.link')
  unlinkAuthority(@CurrentUser() user: RequestUser, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) { return this.regulatory.unlinkAuthorityFromJurisdiction(user.id, this.scope(user), linkId, dto, user.permissions); }

  @Get('applicability/dashboard')
  @Permissions('regulatory.applicability.dashboard.view')
  applicabilityDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityDashboard(this.scope(user), query); }

  @Get('applicability/dashboard/summary')
  @Permissions('regulatory.applicability.dashboard.view')
  applicabilitySummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilitySummary(this.scope(user), query); }

  @Get('applicability/matrix')
  @Permissions('regulatory.applicability.matrix.view')
  applicabilityMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityMatrix(this.scope(user), query); }

  @Get('applicability/assessments')
  @Permissions('regulatory.applicability.view')
  applicabilityAssessments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityAssessments(this.scope(user), query); }

  @Post('applicability/assessments')
  @Permissions('regulatory.applicability.assessment.create')
  createApplicabilityAssessment(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createApplicabilityAssessment(user.id, this.scope(user), dto, user.permissions); }

  @Get('applicability/assessments/:assessmentId')
  @Permissions('regulatory.applicability.view')
  applicabilityAssessmentDetail(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.getApplicabilityAssessment(this.scope(user), assessmentId); }

  @Patch('applicability/assessments/:assessmentId')
  @Permissions('regulatory.applicability.assessment.edit')
  updateApplicabilityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateApplicabilityAssessment(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('applicability/assessments/:assessmentId/answer')
  @Permissions('regulatory.applicability.assessment.edit')
  answerApplicabilityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.answerApplicabilityAssessment(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('applicability/assessments/:assessmentId/run-gap-check')
  @Permissions('regulatory.applicability.gap.manage')
  runApplicabilityGapCheck(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.runApplicabilityGapCheck(user.id, this.scope(user), assessmentId, user.permissions); }

  @Post('applicability/assessments/:assessmentId/save-decision')
  @Permissions('regulatory.applicability.decision.make')
  saveApplicabilityDecision(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.saveApplicabilityDecision(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('applicability/assessments/:assessmentId/submit-review')
  @Permissions('regulatory.applicability.assessment.submit')
  submitApplicabilityReview(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.submitApplicabilityReview(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('applicability/assessments/:assessmentId/mark-stale')
  @Permissions('regulatory.applicability.assessment.edit')
  markApplicabilityStale(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.markApplicabilityStale(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('applicability/assessments/:assessmentId/archive')
  @Permissions('regulatory.applicability.assessment.archive')
  archiveApplicabilityAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveApplicabilityAssessment(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Get('applicability/assessments/:assessmentId/questions')
  @Permissions('regulatory.applicability.view')
  assessmentQuestions(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.assessmentQuestions(this.scope(user), assessmentId); }

  @Get('applicability/assessments/:assessmentId/scope')
  @Permissions('regulatory.applicability.view')
  assessmentScope(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.assessmentScope(this.scope(user), assessmentId); }

  @Get('applicability/assessments/:assessmentId/decision')
  @Permissions('regulatory.applicability.view')
  assessmentDecision(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.assessmentDecision(this.scope(user), assessmentId); }

  @Get('applicability/assessments/:assessmentId/gaps')
  @Permissions('regulatory.applicability.gap.view')
  assessmentGaps(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.assessmentGaps(this.scope(user), assessmentId); }

  @Get('applicability/assessments/:assessmentId/history')
  @Permissions('regulatory.applicability.history.view')
  assessmentHistory(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.assessmentHistory(this.scope(user), assessmentId); }

  @Get('applicability/profiles')
  @Permissions('regulatory.applicability.profile.view')
  applicabilityProfiles(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityProfiles(this.scope(user), query); }

  @Post('applicability/profiles')
  @Permissions('regulatory.applicability.profile.create')
  createApplicabilityProfile(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createApplicabilityProfile(user.id, this.scope(user), dto, user.permissions); }

  @Get('applicability/profiles/:profileId')
  @Permissions('regulatory.applicability.profile.view')
  applicabilityProfileDetail(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) { return this.regulatory.getApplicabilityProfile(this.scope(user), profileId); }

  @Patch('applicability/profiles/:profileId')
  @Permissions('regulatory.applicability.profile.edit')
  updateApplicabilityProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateApplicabilityProfile(user.id, this.scope(user), profileId, dto, user.permissions); }

  @Post('applicability/profiles/:profileId/archive')
  @Permissions('regulatory.applicability.profile.archive')
  archiveApplicabilityProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveApplicabilityProfile(user.id, this.scope(user), profileId, dto, user.permissions); }

  @Post('applicability/profiles/:profileId/reactivate')
  @Permissions('regulatory.applicability.profile.edit')
  reactivateApplicabilityProfile(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) { return this.regulatory.reactivateApplicabilityProfile(user.id, this.scope(user), profileId, dto, user.permissions); }

  @Get('applicability/profiles/:profileId/criteria')
  @Permissions('regulatory.applicability.profile.view')
  profileCriteria(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string) { return this.regulatory.profileCriteria(this.scope(user), profileId); }

  @Post('applicability/profiles/:profileId/criteria')
  @Permissions('regulatory.applicability.criteria.manage')
  createProfileCriterion(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) { return this.regulatory.createProfileCriterion(user.id, this.scope(user), profileId, dto, user.permissions); }

  @Patch('applicability/criteria/:criterionId')
  @Permissions('regulatory.applicability.criteria.manage')
  updateProfileCriterion(@CurrentUser() user: RequestUser, @Param('criterionId') criterionId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateProfileCriterion(user.id, this.scope(user), criterionId, dto, user.permissions); }

  @Delete('applicability/criteria/:criterionId')
  @Permissions('regulatory.applicability.criteria.manage')
  deleteProfileCriterion(@CurrentUser() user: RequestUser, @Param('criterionId') criterionId: string) { return this.regulatory.deleteProfileCriterion(user.id, this.scope(user), criterionId, user.permissions); }

  @Post('applicability/profiles/:profileId/criteria/reorder')
  @Permissions('regulatory.applicability.criteria.manage')
  reorderProfileCriteria(@CurrentUser() user: RequestUser, @Param('profileId') profileId: string, @Body() dto: Record<string, any>) { return this.regulatory.reorderProfileCriteria(user.id, this.scope(user), profileId, dto, user.permissions); }

  @Get('applicability/gaps')
  @Permissions('regulatory.applicability.gap.view')
  applicabilityGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityGaps(this.scope(user), query); }

  @Post('applicability/gaps/detect')
  @Permissions('regulatory.applicability.gap.manage')
  detectApplicabilityGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.detectApplicabilityGaps(user.id, this.scope(user), dto, user.permissions); }

  @Post('applicability/gaps')
  @Permissions('regulatory.applicability.gap.manage')
  createApplicabilityGap(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createApplicabilityGap(user.id, this.scope(user), dto, user.permissions); }

  @Patch('applicability/gaps/:gapId')
  @Permissions('regulatory.applicability.gap.manage')
  updateApplicabilityGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateApplicabilityGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('applicability/gaps/:gapId/resolve')
  @Permissions('regulatory.applicability.gap.manage')
  resolveApplicabilityGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.resolveApplicabilityGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('applicability/gaps/:gapId/create-action-foundation')
  @Permissions('regulatory.applicability.gap.manage')
  createActionFoundationForGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.createActionFoundationForGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Get('applicability/history')
  @Permissions('regulatory.applicability.history.view')
  applicabilityHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityHistory(this.scope(user), query); }

  @Get('applicability/settings')
  @Permissions('regulatory.settings.view')
  applicabilitySettings(@CurrentUser() user: RequestUser) { return this.regulatory.applicabilitySettings(this.scope(user)); }

  @Patch('applicability/settings')
  @Permissions('regulatory.applicability.settings.edit')
  updateApplicabilitySettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.updateApplicabilitySettings(user.id, this.scope(user), dto, user.permissions); }

  @Get('obligations/dashboard')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationDashboard(this.scope(user), query); }

  @Get('obligations/dashboard/summary')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationDashboardSummary(this.scope(user), query); }

  @Get('obligations/dashboard/by-jurisdiction')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationByJurisdiction(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationDashboardGroup(this.scope(user), 'jurisdiction_id', query); }

  @Get('obligations/dashboard/by-site')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationDashboardGroup(this.scope(user), 'site_id', query); }

  @Get('obligations/dashboard/by-category')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationByCategory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationDashboardGroup(this.scope(user), 'category', query); }

  @Get('obligations/dashboard/by-module')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationDashboardGroup(this.scope(user), 'related_module', query); }

  @Get('obligations/dashboard/due-soon')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationDashboardDueSoon(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'due-soon', query); }

  @Get('obligations/dashboard/overdue')
  @Permissions('regulatory.obligation.dashboard.view')
  obligationDashboardOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'overdue', query); }

  @Get('obligations/dashboard/gaps')
  @Permissions('regulatory.obligation.gap.view')
  obligationDashboardGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationGaps(this.scope(user), query); }

  @Get('obligations/register')
  @Permissions('regulatory.obligation.register.view')
  obligationRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationRegister(this.scope(user), query); }

  @Get('obligations/summary')
  @Permissions('regulatory.obligation.register.view')
  obligationSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationSummary(this.scope(user), query); }

  @Get('obligations/matrix')
  @Permissions('regulatory.obligation.matrix.view')
  obligationMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationMatrix(this.scope(user), query); }

  @Get('obligations/gaps')
  @Permissions('regulatory.obligation.gap.view')
  obligationGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationGaps(this.scope(user), query); }

  @Post('obligations/gaps/detect')
  @Permissions('regulatory.obligation.gap.manage')
  detectObligationGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.detectObligationGaps(user.id, this.scope(user), dto, user.permissions); }

  @Post('obligations/gaps')
  @Permissions('regulatory.obligation.gap.manage')
  createObligationGap(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createObligationGap(user.id, this.scope(user), dto, user.permissions); }

  @Patch('obligations/gaps/:gapId')
  @Permissions('regulatory.obligation.gap.manage')
  updateObligationGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateObligationGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('obligations/gaps/:gapId/resolve')
  @Permissions('regulatory.obligation.gap.manage')
  resolveObligationGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.resolveObligationGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('obligations/gaps/:gapId/create-action-foundation')
  @Permissions('regulatory.obligation.gap.manage')
  createObligationGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.createActionFoundationForObligationGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Get('obligations/history')
  @Permissions('regulatory.obligation.history.view')
  obligationHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationHistory(this.scope(user), query); }

  @Get('obligations/settings')
  @Permissions('regulatory.settings.view')
  obligationSettings(@CurrentUser() user: RequestUser) { return this.regulatory.obligationSettings(this.scope(user)); }

  @Patch('obligations/settings')
  @Permissions('regulatory.obligation.settings.edit')
  updateObligationSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.updateObligationSettings(user.id, this.scope(user), dto, user.permissions); }

  @Get('obligations/due-soon')
  @Permissions('regulatory.obligation.register.view')
  obligationsDueSoon(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'due-soon', query); }

  @Get('obligations/overdue')
  @Permissions('regulatory.obligation.register.view')
  obligationsOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'overdue', query); }

  @Get('obligations/missing-owner')
  @Permissions('regulatory.obligation.register.view')
  obligationsMissingOwner(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'missing-owner', query); }

  @Get('obligations/missing-evidence')
  @Permissions('regulatory.obligation.register.view')
  obligationsMissingEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'missing-evidence', query); }

  @Get('obligations/missing-module-mapping')
  @Permissions('regulatory.obligation.register.view')
  obligationsMissingModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'missing-module-mapping', query); }

  @Get('obligations/stale')
  @Permissions('regulatory.obligation.stale.view')
  obligationsStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'stale', query); }

  @Get('obligations/applicable')
  @Permissions('regulatory.obligation.register.view')
  obligationsApplicable(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'applicable', query); }

  @Get('obligations/not-applicable')
  @Permissions('regulatory.obligation.register.view')
  obligationsNotApplicable(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'not-applicable', query); }

  @Get('obligations/high-risk')
  @Permissions('regulatory.obligation.register.view')
  obligationsHighRisk(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'high-risk', query); }

  @Get('obligations/psm-critical')
  @Permissions('regulatory.obligation.register.view')
  obligationsPsmCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'psm-critical', query); }

  @Get('obligations/environmental-critical')
  @Permissions('regulatory.obligation.register.view')
  obligationsEnvironmentalCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'environmental-critical', query); }

  @Get('obligations/safety-critical')
  @Permissions('regulatory.obligation.register.view')
  obligationsSafetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationFilteredView(this.scope(user), 'safety-critical', query); }

  @Get('obligations')
  @Permissions('regulatory.obligation.register.view')
  obligationsRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.obligationRegister(this.scope(user), query); }

  @Post('obligations')
  @Permissions('regulatory.obligation.create')
  createObligation(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createObligation(user.id, this.scope(user), dto, user.permissions); }

  @Get('obligations/:obligationId')
  @Permissions('regulatory.obligation.view')
  obligationDetail(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationOverview(this.scope(user), obligationId); }

  @Patch('obligations/:obligationId')
  @Permissions('regulatory.obligation.edit')
  updateObligation(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateObligation(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/archive')
  @Permissions('regulatory.obligation.archive')
  archiveObligation(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveObligation(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/reactivate')
  @Permissions('regulatory.obligation.reactivate')
  reactivateObligation(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.reactivateObligation(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/lock')
  @Permissions('regulatory.obligation.lock')
  lockObligation(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.lockObligation(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/unlock')
  @Permissions('regulatory.obligation.unlock')
  unlockObligation(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.unlockObligation(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/assign-owner')
  @Permissions('regulatory.obligation.assign_owner')
  assignObligationOwner(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.assignObligationOwner(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/change-status')
  @Permissions('regulatory.obligation.change_status')
  changeObligationStatus(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.changeObligationStatus(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/change-applicability')
  @Permissions('regulatory.obligation.change_applicability')
  changeObligationApplicability(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.changeObligationApplicability(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/change-compliance-status')
  @Permissions('regulatory.obligation.change_compliance_status')
  changeObligationCompliance(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.changeObligationComplianceStatus(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Post('obligations/:obligationId/mark-stale')
  @Permissions('regulatory.obligation.stale.view')
  markObligationStale(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.markObligationStale(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Get('obligations/:obligationId/overview')
  @Permissions('regulatory.obligation.view')
  obligationOverview(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationOverview(this.scope(user), obligationId); }

  @Get('obligations/:obligationId/scope')
  @Permissions('regulatory.obligation.scope.view')
  obligationScope(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationSection(this.scope(user), obligationId, 'scope'); }

  @Patch('obligations/:obligationId/scope')
  @Permissions('regulatory.obligation.scope.manage')
  updateObligationScope(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateObligationScope(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Get('obligations/:obligationId/evidence-expectations')
  @Permissions('regulatory.obligation.evidence_expectation.view')
  obligationEvidence(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationEvidenceExpectations(this.scope(user), obligationId); }

  @Post('obligations/:obligationId/evidence-expectations')
  @Permissions('regulatory.obligation.evidence_expectation.manage')
  upsertObligationEvidence(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.upsertObligationEvidenceExpectation(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Get('obligations/:obligationId/module-mapping')
  @Permissions('regulatory.obligation.module_mapping.view')
  obligationModuleMapping(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationModuleMappings(this.scope(user), obligationId); }

  @Post('obligations/:obligationId/module-mapping')
  @Permissions('regulatory.obligation.module_mapping.manage')
  upsertObligationModuleMapping(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.upsertObligationModuleMapping(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Get('obligations/:obligationId/applicability')
  @Permissions('regulatory.obligation.view')
  obligationApplicabilitySection(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationSection(this.scope(user), obligationId, 'applicability'); }

  @Get('obligations/:obligationId/compliance-status')
  @Permissions('regulatory.obligation.view')
  obligationComplianceSection(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationSection(this.scope(user), obligationId, 'compliance-status'); }

  @Get('obligations/:obligationId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  obligationAuditMappingSection(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditMappings(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Post('obligations/:obligationId/audit-mapping')
  @Permissions('regulatory.audit_mapping.create')
  createObligationAuditMapping(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.createSourceAuditMapping(user.id, this.scope(user), 'obligation', obligationId, dto, user.permissions); }

  @Get('obligations/:obligationId/audit-mapping/coverage')
  @Permissions('regulatory.audit_mapping.coverage.view')
  obligationAuditMappingCoverage(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditCoverage(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/audit-mapping/traceability')
  @Permissions('regulatory.audit_mapping.traceability.view')
  obligationAuditMappingTraceability(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditTraceability(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/audit-mapping/gaps')
  @Permissions('regulatory.audit_mapping.gap.view')
  obligationAuditMappingGaps(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditGaps(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/actions')
  @Permissions('regulatory.action.view')
  obligationActionsSection(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Obligation', obligationId, query, user.permissions);
  }

  @Post('obligations/:obligationId/actions')
  @Permissions('regulatory.action.create')
  createObligationAction(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Obligation', obligationId, dto, user.permissions);
  }

  @Post('obligations/:obligationId/actions/link-existing')
  @Permissions('regulatory.action.link_existing')
  linkExistingObligationAction(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.linkExistingRegulatoryAction(user.id, this.scope(user), { ...dto, sourceType: 'Obligation', obligationId, sourceRecordId: obligationId }, user.permissions);
  }

  @Get('obligations/:obligationId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  obligationActionsClosureReadiness(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Obligation', obligationId, query, user.permissions);
  }

  @Get('obligations/:obligationId/review')
  @Permissions('regulatory.review.view')
  obligationReviewSection(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationSection(this.scope(user), obligationId, 'review'); }

  @Get('obligations/:obligationId/reports')
  @Permissions('regulatory.report.view')
  obligationReportsSection(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationSection(this.scope(user), obligationId, 'reports'); }

  @Get('obligations/:obligationId/history')
  @Permissions('regulatory.obligation.history.view')
  obligationDetailHistory(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationHistory(this.scope(user), { obligationId }); }

  @Get('obligations/:obligationId/links')
  @Permissions('regulatory.obligation.link.view')
  obligationLinks(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string) { return this.regulatory.obligationLinks(this.scope(user), obligationId); }

  @Post('obligations/:obligationId/links')
  @Permissions('regulatory.obligation.link.manage')
  createObligationLink(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Body() dto: Record<string, any>) { return this.regulatory.createObligationLink(user.id, this.scope(user), obligationId, dto, user.permissions); }

  @Delete('obligations/:obligationId/links/:linkId')
  @Permissions('regulatory.obligation.link.manage')
  removeObligationLink(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) { return this.regulatory.removeObligationLink(user.id, this.scope(user), obligationId, linkId, dto, user.permissions); }

  @Get('applicability/not-assessed')
  @Permissions('regulatory.applicability.view')
  applicabilityNotAssessed(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'not-assessed', query); }

  @Get('applicability/applicable')
  @Permissions('regulatory.applicability.view')
  applicabilityApplicable(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'applicable', query); }

  @Get('applicability/partially-applicable')
  @Permissions('regulatory.applicability.view')
  applicabilityPartiallyApplicable(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'partially-applicable', query); }

  @Get('applicability/not-applicable')
  @Permissions('regulatory.applicability.view')
  applicabilityNotApplicable(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'not-applicable', query); }

  @Get('applicability/under-review')
  @Permissions('regulatory.applicability.view')
  applicabilityUnderReview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'under-review', query); }

  @Get('applicability/stale')
  @Permissions('regulatory.applicability.stale.view')
  applicabilityStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'stale', query); }

  @Get('applicability/missing-rationale')
  @Permissions('regulatory.applicability.view')
  applicabilityMissingRationale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.applicabilityFiltered(this.scope(user), 'missing-rationale', query); }

  @Get('sites/:siteId/applicability')
  @Permissions('regulatory.applicability.view')
  siteApplicability(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedApplicability(this.scope(user), 'siteId', siteId, query); }

  @Get('units/:unitId/applicability')
  @Permissions('regulatory.applicability.view')
  unitApplicability(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedApplicability(this.scope(user), 'unitId', unitId, query); }

  @Get('areas/:areaId/applicability')
  @Permissions('regulatory.applicability.view')
  areaApplicability(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedApplicability(this.scope(user), 'areaId', areaId, query); }

  @Get('equipment/:equipmentId/applicability')
  @Permissions('regulatory.applicability.view')
  equipmentApplicability(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedApplicability(this.scope(user), 'equipmentId', equipmentId, query); }

  @Get('sites/:siteId/obligations')
  @Permissions('regulatory.obligation.register.view')
  siteObligations(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedObligations(this.scope(user), 'siteId', siteId, query); }

  @Get('units/:unitId/obligations')
  @Permissions('regulatory.obligation.register.view')
  unitObligations(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedObligations(this.scope(user), 'unitId', unitId, query); }

  @Get('areas/:areaId/obligations')
  @Permissions('regulatory.obligation.register.view')
  areaObligations(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedObligations(this.scope(user), 'areaId', areaId, query); }

  @Get('equipment/:equipmentId/obligations')
  @Permissions('regulatory.obligation.register.view')
  equipmentObligations(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedObligations(this.scope(user), 'equipmentId', equipmentId, query); }

  @Get('compliance-status')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboard(this.scope(user), query); }

  @Get('compliance-status/dashboard')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboard(this.scope(user), query); }

  @Get('compliance-status/dashboard/summary')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboardSummary(this.scope(user), query); }

  @Get('compliance-status/dashboard/by-site')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboardGroup(this.scope(user), 'site_id', query); }

  @Get('compliance-status/dashboard/by-unit')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboardGroup(this.scope(user), 'unit_id', query); }

  @Get('compliance-status/dashboard/by-category')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusByCategory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboardGroup(this.scope(user), 'category', query); }

  @Get('compliance-status/dashboard/by-jurisdiction')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusByJurisdiction(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboardGroup(this.scope(user), 'jurisdiction_id', query); }

  @Get('compliance-status/dashboard/by-owner')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusByOwner(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceDashboardGroup(this.scope(user), 'owner_label', query); }

  @Get('compliance-status/dashboard/gaps')
  @Permissions('regulatory.compliance.gap.view')
  complianceStatusDashboardGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceGaps(this.scope(user), query); }

  @Get('compliance-status/dashboard/stale')
  @Permissions('regulatory.compliance.stale.view')
  complianceStatusDashboardStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceFilteredView(this.scope(user), 'stale', query); }

  @Get('compliance-status/dashboard/recent')
  @Permissions('regulatory.compliance.dashboard.view')
  complianceStatusDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceRegister(this.scope(user), { ...query, sort: 'updated_at.desc', limit: query.limit ?? 10 }); }

  @Get('compliance-status/register')
  @Permissions('regulatory.compliance.register.view')
  complianceStatusRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceRegister(this.scope(user), query); }

  @Get('compliance-status/assessments')
  @Permissions('regulatory.compliance.assessment.view')
  complianceAssessments(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceRegister(this.scope(user), query); }

  @Post('compliance-status/assessments')
  @Permissions('regulatory.compliance.assessment.create')
  createComplianceAssessment(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createComplianceAssessment(user.id, this.scope(user), dto, user.permissions); }

  @Get('compliance-status/summary')
  @Permissions('regulatory.compliance.register.view')
  complianceStatusSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceSummary(this.scope(user), query); }

  @Get('compliance-status/matrix')
  @Permissions('regulatory.compliance.matrix.view')
  complianceStatusMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceMatrix(this.scope(user), query); }

  @Get('compliance-status/gaps')
  @Permissions('regulatory.compliance.gap.view')
  complianceStatusGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceGaps(this.scope(user), query); }

  @Post('compliance-status/gaps/detect')
  @Permissions('regulatory.compliance.gap.create')
  detectComplianceStatusGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.detectComplianceGaps(user.id, this.scope(user), dto, user.permissions); }

  @Post('compliance-status/gaps')
  @Permissions('regulatory.compliance.gap.create')
  createComplianceStatusGap(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createComplianceGap(user.id, this.scope(user), dto, user.permissions); }

  @Get('compliance-status/gaps/:gapId')
  @Permissions('regulatory.compliance.gap.view')
  complianceStatusGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) { return this.regulatory.getComplianceGap(this.scope(user), gapId); }

  @Patch('compliance-status/gaps/:gapId')
  @Permissions('regulatory.compliance.gap.edit')
  updateComplianceStatusGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateComplianceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('compliance-status/gaps/:gapId/resolve')
  @Permissions('regulatory.compliance.gap.resolve')
  resolveComplianceStatusGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.resolveComplianceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('compliance-status/gaps/:gapId/archive')
  @Permissions('regulatory.compliance.gap.archive')
  archiveComplianceStatusGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveComplianceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('compliance-status/gaps/:gapId/create-action-foundation')
  @Permissions('regulatory.compliance.gap.create_action_foundation')
  createComplianceGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.createActionFoundationForComplianceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('compliance-status/gaps/:gapId/link-capa-foundation')
  @Permissions('regulatory.compliance.gap.create_action_foundation')
  linkComplianceGapCapa(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkCapaFoundationForComplianceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Get('compliance-status/history')
  @Permissions('regulatory.compliance.history.view')
  complianceStatusHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.complianceHistory(this.scope(user), query); }

  @Get('compliance-status/settings')
  @Permissions('regulatory.settings.view')
  complianceStatusSettings(@CurrentUser() user: RequestUser) { return this.regulatory.complianceSettings(this.scope(user)); }

  @Patch('compliance-status/settings')
  @Permissions('regulatory.compliance.settings.edit')
  updateComplianceStatusSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.updateComplianceSettings(user.id, this.scope(user), dto, user.permissions); }

  @Get('compliance-status/rollups/:regulationId')
  @Permissions('regulatory.compliance.rollup.view')
  complianceStatusRollup(@CurrentUser() user: RequestUser, @Param('regulationId') regulationId: string) { return this.regulatory.complianceRollup(this.scope(user), regulationId); }

  @Post('compliance-status/rollups/:regulationId/recalculate')
  @Permissions('regulatory.compliance.rollup.recalculate')
  recalculateComplianceStatusRollup(@CurrentUser() user: RequestUser, @Param('regulationId') regulationId: string) { return this.regulatory.recalculateComplianceRollup(user.id, this.scope(user), regulationId, user.permissions); }

  @Get('compliance-status/:view')
  @Permissions('regulatory.compliance.register.view')
  complianceStatusFiltered(@CurrentUser() user: RequestUser, @Param('view') view: string, @Query() query: Record<string, any>) { return this.regulatory.complianceFilteredView(this.scope(user), view, query); }

  @Get('compliance-status/assessments/:assessmentId')
  @Permissions('regulatory.compliance.assessment.view')
  complianceAssessmentDetail(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.getComplianceAssessment(this.scope(user), assessmentId); }

  @Patch('compliance-status/assessments/:assessmentId')
  @Permissions('regulatory.compliance.assessment.edit')
  updateComplianceAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateComplianceAssessment(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('compliance-status/assessments/:assessmentId/run-readiness-check')
  @Permissions('regulatory.compliance.assessment.view')
  runComplianceReadinessCheck(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.runComplianceReadinessCheck(user.id, this.scope(user), assessmentId, user.permissions); }

  @Post('compliance-status/assessments/:assessmentId/change-status')
  @Permissions('regulatory.compliance.status.change')
  changeComplianceAssessmentStatus(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.changeComplianceAssessmentStatus(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('compliance-status/assessments/:assessmentId/complete')
  @Permissions('regulatory.compliance.assessment.complete')
  completeComplianceAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.completeComplianceAssessment(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('compliance-status/assessments/:assessmentId/submit-review')
  @Permissions('regulatory.compliance.assessment.complete')
  submitComplianceReview(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.submitComplianceReview(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('compliance-status/assessments/:assessmentId/mark-stale')
  @Permissions('regulatory.compliance.stale.reassess')
  markComplianceAssessmentStale(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.markComplianceAssessmentStale(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Post('compliance-status/assessments/:assessmentId/archive')
  @Permissions('regulatory.compliance.assessment.archive')
  archiveComplianceAssessment(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveComplianceAssessment(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Get('compliance-status/assessments/:assessmentId/criteria')
  @Permissions('regulatory.compliance.criteria.view')
  complianceAssessmentCriteria(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.complianceCriteria(this.scope(user), assessmentId); }

  @Post('compliance-status/assessments/:assessmentId/criteria')
  @Permissions('regulatory.compliance.criteria.manage')
  upsertComplianceCriterion(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Body() dto: Record<string, any>) { return this.regulatory.upsertComplianceCriterion(user.id, this.scope(user), assessmentId, dto, user.permissions); }

  @Get('compliance-status/assessments/:assessmentId/evidence-readiness')
  @Permissions('regulatory.compliance.evidence_readiness.view')
  complianceAssessmentEvidenceReadiness(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.complianceEvidenceReadiness(this.scope(user), assessmentId); }

  @Post('compliance-status/assessments/:assessmentId/evidence-readiness/recalculate')
  @Permissions('regulatory.compliance.evidence_readiness.manage')
  recalculateComplianceEvidenceReadiness(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string) { return this.regulatory.recalculateComplianceEvidenceReadiness(user.id, this.scope(user), assessmentId, user.permissions); }

  @Get('compliance-status/assessments/:assessmentId/:section')
  @Permissions('regulatory.compliance.assessment.view')
  complianceAssessmentSection(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Param('section') section: string) { return this.regulatory.complianceAssessmentSection(this.scope(user), assessmentId, section); }

  @Get('obligations/:obligationId/compliance-status/new-assessment')
  @Permissions('regulatory.compliance.assessment.create')
  newObligationComplianceAssessment(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.createSourceComplianceAssessment(user.id, this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/compliance-status/gaps')
  @Permissions('regulatory.compliance.gap.view')
  obligationComplianceGaps(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceComplianceGaps(this.scope(user), 'obligation', obligationId, query); }

  @Get('obligations/:obligationId/compliance-status/history')
  @Permissions('regulatory.compliance.history.view')
  obligationComplianceHistory(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceComplianceHistory(this.scope(user), 'obligation', obligationId, query); }

  @Get('sites/:siteId/compliance-status')
  @Permissions('regulatory.compliance.register.view')
  siteCompliance(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedCompliance(this.scope(user), 'siteId', siteId, query); }

  @Get('units/:unitId/compliance-status')
  @Permissions('regulatory.compliance.register.view')
  unitCompliance(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedCompliance(this.scope(user), 'unitId', unitId, query); }

  @Get('areas/:areaId/compliance-status')
  @Permissions('regulatory.compliance.register.view')
  areaCompliance(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedCompliance(this.scope(user), 'areaId', areaId, query); }

  @Get('equipment/:equipmentId/compliance-status')
  @Permissions('regulatory.compliance.register.view')
  equipmentCompliance(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedCompliance(this.scope(user), 'equipmentId', equipmentId, query); }

  @Get('history')
  @Permissions('regulatory.history.view')
  history(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.history(this.scope(user), query);
  }

  @Get('settings')
  @Permissions('regulatory.settings.view')
  settings(@CurrentUser() user: RequestUser) {
    return this.regulatory.settings(this.scope(user));
  }

  @Patch('settings')
  @Permissions('regulatory.settings.edit')
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.updateSettings(user.id, this.scope(user), dto, user.permissions);
  }

  @Get('lookups/source-types')
  @Permissions('regulatory.register.view')
  sourceTypes() { return this.regulatory.lookup('sourceTypes'); }

  @Get('lookups/categories')
  @Permissions('regulatory.register.view')
  categories() { return this.regulatory.lookup('categories'); }

  @Get('lookups/jurisdiction-levels')
  @Permissions('regulatory.register.view')
  jurisdictionLevels() { return this.regulatory.lookup('jurisdictionLevels'); }

  @Get('lookups/criticality-levels')
  @Permissions('regulatory.register.view')
  criticalityLevels() { return this.regulatory.lookup('criticalityLevels'); }

  @Get('lookups/register-statuses')
  @Permissions('regulatory.register.view')
  registerStatuses() { return this.regulatory.lookup('registerStatuses'); }

  @Get('lookups/applicability-statuses')
  @Permissions('regulatory.register.view')
  applicabilityStatuses() { return this.regulatory.lookup('applicabilityStatuses'); }

  @Get('lookups/compliance-statuses')
  @Permissions('regulatory.register.view')
  complianceStatuses() { return this.regulatory.lookup('complianceStatuses'); }

  @Get('lookups/review-statuses')
  @Permissions('regulatory.register.view')
  reviewStatuses() { return this.regulatory.lookup('reviewStatuses'); }

  @Get('lookups/review-frequencies')
  @Permissions('regulatory.register.view')
  reviewFrequencies() { return this.regulatory.lookup('reviewFrequencies'); }

  @Get('lookups/link-modules')
  @Permissions('regulatory.register.view')
  linkModules() { return this.regulatory.lookup('linkModules'); }

  @Get('lookups/authority-types')
  @Permissions('regulatory.authority.view')
  authorityTypes() { return this.regulatory.lookup('authorityTypes'); }

  @Get('lookups/authority-statuses')
  @Permissions('regulatory.authority.view')
  authorityStatuses() { return this.regulatory.lookup('authorityStatuses'); }

  @Get('lookups/applicability-profile-types')
  @Permissions('regulatory.applicability.profile.view')
  applicabilityProfileTypes() { return this.regulatory.lookup('applicabilityProfileTypes'); }

  @Get('lookups/applicability-profile-statuses')
  @Permissions('regulatory.applicability.profile.view')
  applicabilityProfileStatuses() { return this.regulatory.lookup('applicabilityProfileStatuses'); }

  @Get('lookups/applicability-question-types')
  @Permissions('regulatory.applicability.profile.view')
  applicabilityQuestionTypes() { return this.regulatory.lookup('applicabilityQuestionTypes'); }

  @Get('lookups/applicability-effects')
  @Permissions('regulatory.applicability.profile.view')
  applicabilityEffects() { return this.regulatory.lookup('applicabilityEffects'); }

  @Get('lookups/applicability-assessment-methods')
  @Permissions('regulatory.applicability.view')
  applicabilityAssessmentMethods() { return this.regulatory.lookup('applicabilityAssessmentMethods'); }

  @Get('lookups/applicability-assessment-statuses')
  @Permissions('regulatory.applicability.view')
  applicabilityAssessmentStatuses() { return this.regulatory.lookup('applicabilityAssessmentStatuses'); }

  @Get('lookups/applicability-gap-types')
  @Permissions('regulatory.applicability.gap.view')
  applicabilityGapTypes() { return this.regulatory.lookup('applicabilityGapTypes'); }

  @Get('lookups/applicability-decisions')
  @Permissions('regulatory.applicability.view')
  applicabilityDecisions() { return this.regulatory.lookup('applicabilityDecisions'); }

  @Get('lookups/obligation-types')
  @Permissions('regulatory.obligation.view')
  obligationTypes() { return this.regulatory.lookup('obligationTypes'); }

  @Get('lookups/obligation-categories')
  @Permissions('regulatory.obligation.view')
  obligationCategories() { return this.regulatory.lookup('obligationCategories'); }

  @Get('lookups/obligation-statuses')
  @Permissions('regulatory.obligation.view')
  obligationStatuses() { return this.regulatory.lookup('obligationStatuses'); }

  @Get('lookups/obligation-frequencies')
  @Permissions('regulatory.obligation.view')
  obligationFrequencies() { return this.regulatory.lookup('obligationFrequencies'); }

  @Get('lookups/obligation-trigger-events')
  @Permissions('regulatory.obligation.view')
  obligationTriggerEvents() { return this.regulatory.lookup('obligationTriggerEvents'); }

  @Get('lookups/evidence-expectation-statuses')
  @Permissions('regulatory.obligation.evidence_expectation.view')
  evidenceExpectationStatuses() { return this.regulatory.lookup('evidenceExpectationStatuses'); }

  @Get('lookups/module-mapping-statuses')
  @Permissions('regulatory.obligation.module_mapping.view')
  moduleMappingStatuses() { return this.regulatory.lookup('moduleMappingStatuses'); }

  @Get('lookups/obligation-gap-types')
  @Permissions('regulatory.obligation.gap.view')
  obligationGapTypes() { return this.regulatory.lookup('obligationGapTypes'); }

  @Get('lookups/obligation-stale-statuses')
  @Permissions('regulatory.obligation.stale.view')
  obligationStaleStatuses() { return this.regulatory.lookup('obligationStaleStatuses'); }

  @Get('lookups/compliance-assessment-statuses')
  @Permissions('regulatory.compliance.view')
  complianceAssessmentStatuses() { return this.regulatory.lookup('complianceAssessmentStatuses'); }

  @Get('lookups/compliance-evidence-readiness-statuses')
  @Permissions('regulatory.compliance.evidence_readiness.view')
  complianceEvidenceReadinessStatuses() { return this.regulatory.lookup('complianceEvidenceReadinessStatuses'); }

  @Get('lookups/compliance-criteria-statuses')
  @Permissions('regulatory.compliance.criteria.view')
  complianceCriteriaStatuses() { return this.regulatory.lookup('complianceCriteriaStatuses'); }

  @Get('lookups/compliance-gap-types')
  @Permissions('regulatory.compliance.gap.view')
  complianceGapTypes() { return this.regulatory.lookup('complianceGapTypes'); }

  @Get('lookups/compliance-gap-statuses')
  @Permissions('regulatory.compliance.gap.view')
  complianceGapStatuses() { return this.regulatory.lookup('complianceGapStatuses'); }

  @Get('lookups/compliance-gap-severities')
  @Permissions('regulatory.compliance.gap.view')
  complianceGapSeverities() { return this.regulatory.lookup('complianceGapSeverities'); }

  @Get('lookups/compliance-stale-statuses')
  @Permissions('regulatory.compliance.stale.view')
  complianceStaleStatuses() { return this.regulatory.lookup('complianceStaleStatuses'); }

  @Get('lookups/compliance-source-types')
  @Permissions('regulatory.compliance.view')
  complianceSourceTypes() { return this.regulatory.lookup('complianceSourceTypes'); }

  @Get('lookups/evidence-source-types')
  @Permissions('regulatory.evidence.view')
  evidenceSourceTypes() { return this.regulatory.lookup('evidenceSourceTypes'); }

  @Get('lookups/evidence-types')
  @Permissions('regulatory.evidence.view')
  evidenceTypes() { return this.regulatory.lookup('evidenceTypes'); }

  @Get('lookups/evidence-statuses')
  @Permissions('regulatory.evidence.view')
  evidenceStatuses() { return this.regulatory.lookup('evidenceStatuses'); }

  @Get('lookups/evidence-review-statuses')
  @Permissions('regulatory.evidence.review.view')
  evidenceReviewStatuses() { return this.regulatory.lookup('evidenceReviewStatuses'); }

  @Get('lookups/evidence-readiness-statuses')
  @Permissions('regulatory.evidence.view')
  evidenceReadinessStatuses() { return this.regulatory.lookup('evidenceReadinessStatuses'); }

  @Get('lookups/evidence-source-modules')
  @Permissions('regulatory.evidence.view')
  evidenceSourceModules() { return this.regulatory.lookup('evidenceSourceModules'); }

  @Get('lookups/evidence-requirement-statuses')
  @Permissions('regulatory.evidence.requirement.view')
  evidenceRequirementStatuses() { return this.regulatory.lookup('evidenceRequirementStatuses'); }

  @Get('lookups/evidence-gap-types')
  @Permissions('regulatory.evidence.gap.view')
  evidenceGapTypes() { return this.regulatory.lookup('evidenceGapTypes'); }

  @Get('lookups/evidence-package-types')
  @Permissions('regulatory.evidence.package.view')
  evidencePackageTypes() { return this.regulatory.lookup('evidencePackageTypes'); }

  @Get('lookups/evidence-package-statuses')
  @Permissions('regulatory.evidence.package.view')
  evidencePackageStatuses() { return this.regulatory.lookup('evidencePackageStatuses'); }

  @Get('lookups/evidence-confidentiality-levels')
  @Permissions('regulatory.evidence.view')
  evidenceConfidentialityLevels() { return this.regulatory.lookup('evidenceConfidentialityLevels'); }

  @Get('lookups/evidence-stale-statuses')
  @Permissions('regulatory.evidence.stale.view')
  evidenceStaleStatuses() { return this.regulatory.lookup('evidenceStaleStatuses'); }

  @Get('lookups/audit-mapping-types')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingTypes() { return this.regulatory.lookup('auditMappingTypes'); }

  @Get('lookups/audit-mapping-source-types')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingSourceTypes() { return this.regulatory.lookup('auditMappingSourceTypes'); }

  @Get('lookups/audit-target-types')
  @Permissions('regulatory.audit_mapping.view')
  auditTargetTypes() { return this.regulatory.lookup('auditTargetTypes'); }

  @Get('lookups/audit-mapping-statuses')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingStatuses() { return this.regulatory.lookup('auditMappingStatuses'); }

  @Get('lookups/audit-coverage-statuses')
  @Permissions('regulatory.audit_mapping.coverage.view')
  auditCoverageStatuses() { return this.regulatory.lookup('auditCoverageStatuses'); }

  @Get('lookups/audit-verification-statuses')
  @Permissions('regulatory.audit_mapping.review.view')
  auditVerificationStatuses() { return this.regulatory.lookup('auditVerificationStatuses'); }

  @Get('lookups/audit-mapping-gap-types')
  @Permissions('regulatory.audit_mapping.gap.view')
  auditMappingGapTypes() { return this.regulatory.lookup('auditMappingGapTypes'); }

  @Get('lookups/audit-mapping-stale-statuses')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingStaleStatuses() { return this.regulatory.lookup('auditMappingStaleStatuses'); }

  @Get('lookups/regulatory-action-source-types')
  @Permissions('regulatory.action.view')
  regulatoryActionSourceTypes() { return this.regulatory.lookup('regulatoryActionSourceTypes'); }

  @Get('lookups/regulatory-action-types')
  @Permissions('regulatory.action.view')
  regulatoryActionTypes() { return this.regulatory.lookup('regulatoryActionTypes'); }

  @Get('lookups/regulatory-action-modes')
  @Permissions('regulatory.action.view')
  regulatoryActionModes() { return this.regulatory.lookup('regulatoryActionModes'); }

  @Get('lookups/regulatory-action-priorities')
  @Permissions('regulatory.action.view')
  regulatoryActionPriorities() { return this.regulatory.lookup('regulatoryActionPriorities'); }

  @Get('lookups/regulatory-action-sync-statuses')
  @Permissions('regulatory.action.view')
  regulatoryActionSyncStatuses() { return this.regulatory.lookup('regulatoryActionSyncStatuses'); }

  @Get('lookups/regulatory-action-closure-readiness-statuses')
  @Permissions('regulatory.action.closure_readiness.view')
  regulatoryActionClosureReadinessStatuses() { return this.regulatory.lookup('regulatoryActionClosureReadinessStatuses'); }

  @Get('lookups/regulatory-action-verification-statuses')
  @Permissions('regulatory.action.verification.view')
  regulatoryActionVerificationStatuses() { return this.regulatory.lookup('regulatoryActionVerificationStatuses'); }

  @Get('lookups/regulatory-action-effectiveness-statuses')
  @Permissions('regulatory.action.effectiveness.view')
  regulatoryActionEffectivenessStatuses() { return this.regulatory.lookup('regulatoryActionEffectivenessStatuses'); }

  @Get('lookups/regulatory-capa-package-types')
  @Permissions('regulatory.capa.view')
  regulatoryCapaPackageTypes() { return this.regulatory.lookup('regulatoryCapaPackageTypes'); }

  @Get('lookups/regulatory-capa-package-statuses')
  @Permissions('regulatory.capa.view')
  regulatoryCapaPackageStatuses() { return this.regulatory.lookup('regulatoryCapaPackageStatuses'); }

  @Get('actions')
  @Permissions('regulatory.action.dashboard.view')
  regulatoryActionsRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionDashboard(this.scope(user), query, user.permissions);
  }

  @Get('actions/dashboard')
  @Permissions('regulatory.action.dashboard.view')
  regulatoryActionsDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionDashboard(this.scope(user), query, user.permissions);
  }

  @Get('actions/dashboard/summary')
  @Permissions('regulatory.action.dashboard.view')
  regulatoryActionsDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionDashboardSummary(this.scope(user), query, user.permissions);
  }

  @Get('actions/dashboard/:group')
  @Permissions('regulatory.action.dashboard.view')
  regulatoryActionsDashboardGroup(@CurrentUser() user: RequestUser, @Param('group') group: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionDashboardGroup(this.scope(user), group, query, user.permissions);
  }

  @Get('actions/register')
  @Permissions('regulatory.action.register.view')
  regulatoryActionsRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionRegister(this.scope(user), query, user.permissions);
  }

  @Get('actions/summary')
  @Permissions('regulatory.action.view')
  regulatoryActionsSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionSummary(this.scope(user), query, user.permissions);
  }

  @Post('actions')
  @Permissions('regulatory.action.create')
  createRegulatoryAction(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.createRegulatoryAction(user.id, this.scope(user), dto, user.permissions);
  }

  @Post('actions/link-existing')
  @Permissions('regulatory.action.link_existing')
  linkExistingRegulatoryAction(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.linkExistingRegulatoryAction(user.id, this.scope(user), dto, user.permissions);
  }

  @Get('actions/open')
  @Permissions('regulatory.action.register.view')
  openRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'open', query, user.permissions);
  }

  @Get('actions/overdue')
  @Permissions('regulatory.action.register.view')
  overdueRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'overdue', query, user.permissions);
  }

  @Get('actions/completed')
  @Permissions('regulatory.action.register.view')
  completedRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'completed', query, user.permissions);
  }

  @Get('actions/pending-verification')
  @Permissions('regulatory.action.register.view')
  pendingVerificationRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'pending-verification', query, user.permissions);
  }

  @Get('actions/verification-failed')
  @Permissions('regulatory.action.register.view')
  verificationFailedRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'verification-failed', query, user.permissions);
  }

  @Get('actions/effectiveness-pending')
  @Permissions('regulatory.action.register.view')
  effectivenessPendingRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'effectiveness-pending', query, user.permissions);
  }

  @Get('actions/ineffective')
  @Permissions('regulatory.action.register.view')
  ineffectiveRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'ineffective', query, user.permissions);
  }

  @Get('actions/ready-for-gap-closure')
  @Permissions('regulatory.action.register.view')
  readyForGapClosureRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'ready-for-gap-closure', query, user.permissions);
  }

  @Get('actions/blocking-compliance')
  @Permissions('regulatory.action.register.view')
  blockingComplianceRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'blocking-compliance', query, user.permissions);
  }

  @Get('actions/no-action')
  @Permissions('regulatory.action.register.view')
  noActionRegulatoryGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'no-action', query, user.permissions);
  }

  @Get('actions/stale-sync')
  @Permissions('regulatory.action.register.view')
  staleSyncRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'stale-sync', query, user.permissions);
  }

  @Get('actions/escalated')
  @Permissions('regulatory.action.register.view')
  escalatedRegulatoryActions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionFilteredView(this.scope(user), 'escalated', query, user.permissions);
  }

  @Get('actions/settings')
  @Permissions('regulatory.action.view')
  regulatoryActionsSettings(@CurrentUser() user: RequestUser) {
    return this.regulatory.regulatoryActionSettings(this.scope(user));
  }

  @Patch('actions/settings')
  @Permissions('regulatory.action.settings.edit')
  updateRegulatoryActionsSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.updateRegulatoryActionSettings(user.id, this.scope(user), dto, user.permissions);
  }

  @Get('actions/capa')
  @Permissions('regulatory.capa.view')
  regulatoryCapaPackages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryCapaPackages(this.scope(user), query, user.permissions);
  }

  @Post('actions/capa')
  @Permissions('regulatory.capa.create')
  createRegulatoryCapaPackage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.regulatory.createRegulatoryCapaPackage(user.id, this.scope(user), dto, user.permissions);
  }

  @Get('actions/capa/:capaPackageId')
  @Permissions('regulatory.capa.view')
  regulatoryCapaPackage(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string) {
    return this.regulatory.getRegulatoryCapaPackage(this.scope(user), capaPackageId, user.permissions);
  }

  @Patch('actions/capa/:capaPackageId')
  @Permissions('regulatory.capa.edit')
  updateRegulatoryCapaPackage(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.updateRegulatoryCapaPackage(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/sources')
  @Permissions('regulatory.capa.add_source')
  addRegulatoryCapaPackageSource(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.addRegulatoryCapaPackageSource(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/actions')
  @Permissions('regulatory.capa.add_action')
  addRegulatoryCapaPackageAction(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.addRegulatoryCapaPackageAction(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Delete('actions/capa/:capaPackageId/actions/:actionLinkId')
  @Permissions('regulatory.capa.add_action')
  removeRegulatoryCapaPackageAction(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.removeRegulatoryCapaPackageAction(user.id, this.scope(user), capaPackageId, actionLinkId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/closure-readiness/check')
  @Permissions('regulatory.action.closure_readiness.check')
  checkRegulatoryCapaPackageClosureReadiness(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string) {
    return this.regulatory.checkRegulatoryCapaPackageClosureReadiness(user.id, this.scope(user), capaPackageId, {}, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/verification')
  @Permissions('regulatory.action.verification.submit')
  submitRegulatoryCapaPackageVerification(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.submitRegulatoryCapaPackageVerification(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/effectiveness')
  @Permissions('regulatory.action.effectiveness.submit')
  submitRegulatoryCapaPackageEffectiveness(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.submitRegulatoryCapaPackageEffectiveness(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/close-foundation')
  @Permissions('regulatory.capa.close_foundation')
  closeRegulatoryCapaPackageFoundation(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.closeRegulatoryCapaPackageFoundation(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/reopen')
  @Permissions('regulatory.capa.reopen')
  reopenRegulatoryCapaPackage(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.reopenRegulatoryCapaPackage(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Post('actions/capa/:capaPackageId/archive')
  @Permissions('regulatory.capa.archive')
  archiveRegulatoryCapaPackage(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.archiveRegulatoryCapaPackage(user.id, this.scope(user), capaPackageId, dto, user.permissions);
  }

  @Get('actions/capa/:capaPackageId/:section')
  @Permissions('regulatory.capa.view')
  regulatoryCapaPackageSection(@CurrentUser() user: RequestUser, @Param('capaPackageId') capaPackageId: string, @Param('section') section: string) {
    return this.regulatory.regulatoryCapaPackageSection(this.scope(user), capaPackageId, section, user.permissions);
  }

  @Get('actions/links/:actionLinkId')
  @Permissions('regulatory.action.view')
  regulatoryActionLink(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string) {
    return this.regulatory.getRegulatoryActionLink(this.scope(user), actionLinkId, user.permissions);
  }

  @Patch('actions/links/:actionLinkId')
  @Permissions('regulatory.action.edit_link')
  updateRegulatoryActionLink(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.updateRegulatoryActionLink(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Post('actions/links/:actionLinkId/sync')
  @Permissions('regulatory.action.sync')
  syncRegulatoryActionLink(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.syncRegulatoryActionLink(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Post('actions/links/:actionLinkId/refresh-snapshot')
  @Permissions('regulatory.action.refresh_snapshot')
  refreshRegulatoryActionSnapshot(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string) {
    return this.regulatory.refreshRegulatoryActionSnapshot(user.id, this.scope(user), actionLinkId, {}, user.permissions);
  }

  @Post('actions/links/:actionLinkId/closure-readiness/check')
  @Permissions('regulatory.action.closure_readiness.check')
  checkRegulatoryActionClosureReadiness(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string) {
    return this.regulatory.checkRegulatoryActionClosureReadiness(user.id, this.scope(user), actionLinkId, {}, user.permissions);
  }

  @Post('actions/links/:actionLinkId/verification')
  @Permissions('regulatory.action.verification.submit')
  submitRegulatoryActionVerification(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.submitRegulatoryActionVerification(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Post('actions/links/:actionLinkId/verification/fail')
  @Permissions('regulatory.action.verification.fail')
  failRegulatoryActionVerification(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.failRegulatoryActionVerification(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Post('actions/links/:actionLinkId/effectiveness')
  @Permissions('regulatory.action.effectiveness.submit')
  submitRegulatoryActionEffectiveness(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.submitRegulatoryActionEffectiveness(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Post('actions/links/:actionLinkId/escalate')
  @Permissions('regulatory.action.escalate')
  escalateRegulatoryAction(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.escalateRegulatoryAction(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Post('actions/links/:actionLinkId/archive')
  @Permissions('regulatory.action.archive_link')
  archiveRegulatoryActionLink(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.archiveRegulatoryActionLink(user.id, this.scope(user), actionLinkId, dto, user.permissions);
  }

  @Get('actions/links/:actionLinkId/sync-log')
  @Permissions('regulatory.action.sync_log.view')
  regulatoryActionSyncLog(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionSyncLog(this.scope(user), actionLinkId, user.permissions);
  }

  @Get('actions/links/:actionLinkId/history')
  @Permissions('regulatory.action.history.view')
  regulatoryActionHistory(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionHistory(this.scope(user), { actionLinkId, ...query }, user.permissions);
  }

  @Get('actions/links/:actionLinkId/:section')
  @Permissions('regulatory.action.view')
  regulatoryActionLinkSection(@CurrentUser() user: RequestUser, @Param('actionLinkId') actionLinkId: string, @Param('section') section: string) {
    return this.regulatory.regulatoryActionLinkSection(this.scope(user), actionLinkId, section, user.permissions);
  }

  @Get('compliance-status/gaps/:gapId/actions')
  @Permissions('regulatory.action.view')
  complianceGapActions(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Compliance Gap', gapId, query, user.permissions);
  }

  @Post('compliance-status/gaps/:gapId/actions')
  @Permissions('regulatory.action.create')
  createComplianceGapRegulatoryAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Compliance Gap', gapId, dto, user.permissions);
  }

  @Get('compliance-status/gaps/:gapId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  complianceGapActionClosureReadiness(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Compliance Gap', gapId, query, user.permissions);
  }

  @Get('evidence/gaps/:gapId/actions')
  @Permissions('regulatory.action.view')
  evidenceGapActions(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Evidence Gap', gapId, query, user.permissions);
  }

  @Post('evidence/gaps/:gapId/actions')
  @Permissions('regulatory.action.create')
  createEvidenceGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Evidence Gap', gapId, dto, user.permissions);
  }

  @Get('evidence/gaps/:gapId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  evidenceGapActionClosureReadiness(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Evidence Gap', gapId, query, user.permissions);
  }

  @Get('audit-mapping/gaps/:gapId/actions')
  @Permissions('regulatory.action.view')
  auditMappingGapActions(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Audit Mapping Gap', gapId, query, user.permissions);
  }

  @Post('audit-mapping/gaps/:gapId/actions')
  @Permissions('regulatory.action.create')
  createAuditMappingGapRegulatoryAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Audit Mapping Gap', gapId, dto, user.permissions);
  }

  @Get('audit-mapping/gaps/:gapId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  auditMappingGapActionClosureReadiness(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Audit Mapping Gap', gapId, query, user.permissions);
  }

  @Get('applicability/gaps/:gapId/actions')
  @Permissions('regulatory.action.view')
  applicabilityGapActions(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Applicability Gap', gapId, query, user.permissions);
  }

  @Post('applicability/gaps/:gapId/actions')
  @Permissions('regulatory.action.create')
  createApplicabilityGapAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Applicability Gap', gapId, dto, user.permissions);
  }

  @Get('applicability/gaps/:gapId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  applicabilityGapActionClosureReadiness(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Applicability Gap', gapId, query, user.permissions);
  }

  @Get('obligations/gaps/:gapId/actions')
  @Permissions('regulatory.action.view')
  obligationGapActions(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Obligation Gap', gapId, query, user.permissions);
  }

  @Post('obligations/gaps/:gapId/actions')
  @Permissions('regulatory.action.create')
  createObligationGapRegulatoryAction(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Obligation Gap', gapId, dto, user.permissions);
  }

  @Get('obligations/gaps/:gapId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  obligationGapActionClosureReadiness(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Obligation Gap', gapId, query, user.permissions);
  }

  @Get('sites/:siteId/actions')
  @Permissions('regulatory.action.register.view')
  siteRegulatoryActions(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionLinks(this.scope(user), { ...query, siteId }, user.permissions);
  }

  @Get('units/:unitId/actions')
  @Permissions('regulatory.action.register.view')
  unitRegulatoryActions(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionLinks(this.scope(user), { ...query, unitId }, user.permissions);
  }

  @Get('areas/:areaId/actions')
  @Permissions('regulatory.action.register.view')
  areaRegulatoryActions(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionLinks(this.scope(user), { ...query, areaId }, user.permissions);
  }

  @Get('equipment/:equipmentId/actions')
  @Permissions('regulatory.action.register.view')
  equipmentRegulatoryActions(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.regulatory.regulatoryActionLinks(this.scope(user), { ...query, equipmentId }, user.permissions);
  }

  @Get('evidence')
  @Permissions('regulatory.evidence.view')
  evidenceRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.evidenceDashboard(this.scope(user), query, user.permissions);
  }

  @Get('evidence/dashboard')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.evidenceDashboard(this.scope(user), query, user.permissions);
  }

  @Get('evidence/dashboard/summary')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.regulatory.evidenceDashboardSummary(this.scope(user), query, user.permissions);
  }

  @Get('evidence/dashboard/by-site')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'site_id', query, user.permissions); }

  @Get('evidence/dashboard/by-unit')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'unit_id', query, user.permissions); }

  @Get('evidence/dashboard/by-obligation')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardByObligation(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'obligation_id', query, user.permissions); }

  @Get('evidence/dashboard/by-status')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardByStatus(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'evidence_status', query, user.permissions); }

  @Get('evidence/dashboard/by-source-module')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardBySourceModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'source_module', query, user.permissions); }

  @Get('evidence/dashboard/by-evidence-type')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardByEvidenceType(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'evidence_type', query, user.permissions); }

  @Get('evidence/dashboard/by-review-status')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardByReviewStatus(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'review_status', query, user.permissions); }

  @Get('evidence/dashboard/by-readiness')
  @Permissions('regulatory.evidence.dashboard.view')
  evidenceDashboardByReadiness(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceDashboardGroup(this.scope(user), 'readiness_status', query, user.permissions); }

  @Get('evidence/register')
  @Permissions('regulatory.evidence.register.view')
  evidenceRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceRegister(this.scope(user), query, user.permissions); }

  @Get('evidence/summary')
  @Permissions('regulatory.evidence.view')
  evidenceSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceSummary(this.scope(user), query, user.permissions); }

  @Get('evidence/requirements')
  @Permissions('regulatory.evidence.requirement.view')
  evidenceRequirements(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceRequirements(this.scope(user), query, user.permissions); }

  @Post('evidence/requirements')
  @Permissions('regulatory.evidence.requirement.create')
  createEvidenceRequirement(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createEvidenceRequirement(user.id, this.scope(user), dto, user.permissions); }

  @Get('evidence/requirements/:requirementId')
  @Permissions('regulatory.evidence.requirement.view')
  evidenceRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) { return this.regulatory.getEvidenceRequirement(this.scope(user), requirementId, user.permissions); }

  @Patch('evidence/requirements/:requirementId')
  @Permissions('regulatory.evidence.requirement.edit')
  updateEvidenceRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateEvidenceRequirement(user.id, this.scope(user), requirementId, dto, user.permissions); }

  @Post('evidence/requirements/:requirementId/archive')
  @Permissions('regulatory.evidence.requirement.archive')
  archiveEvidenceRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveEvidenceRequirement(user.id, this.scope(user), requirementId, dto, user.permissions); }

  @Post('evidence/requirements/:requirementId/reactivate')
  @Permissions('regulatory.evidence.requirement.edit')
  reactivateEvidenceRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() dto: Record<string, any>) { return this.regulatory.reactivateEvidenceRequirement(user.id, this.scope(user), requirementId, dto, user.permissions); }

  @Get('evidence/links')
  @Permissions('regulatory.evidence.link.view')
  evidenceLinks(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceLinks(this.scope(user), query, user.permissions); }

  @Post('evidence/links')
  @Permissions('regulatory.evidence.link.create')
  createEvidenceLink(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createEvidenceLink(user.id, this.scope(user), dto, user.permissions); }

  @Get('evidence/links/:evidenceLinkId')
  @Permissions('regulatory.evidence.link.view')
  evidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string) { return this.regulatory.getEvidenceLink(this.scope(user), evidenceLinkId, user.permissions, true, 'View'); }

  @Patch('evidence/links/:evidenceLinkId')
  @Permissions('regulatory.evidence.link.edit')
  updateEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateEvidenceLink(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Delete('evidence/links/:evidenceLinkId')
  @Permissions('regulatory.evidence.link.remove')
  deleteEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.removeEvidenceLink(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/replace')
  @Permissions('regulatory.evidence.link.replace')
  replaceEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.replaceEvidenceLink(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/archive')
  @Permissions('regulatory.evidence.link.archive')
  archiveEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveEvidenceLink(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/mark-stale')
  @Permissions('regulatory.evidence.stale.view')
  markEvidenceLinkStale(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.markEvidenceLinkStale(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/restrict')
  @Permissions('regulatory.evidence.restricted.manage')
  restrictEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.markEvidenceLinkRestricted(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Get('evidence/links/:evidenceLinkId/preview')
  @Permissions('regulatory.evidence.preview')
  previewEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string) { return this.regulatory.evidenceLinkPreview(user.id, this.scope(user), evidenceLinkId, user.permissions); }

  @Get('evidence/links/:evidenceLinkId/download')
  @Permissions('regulatory.evidence.download')
  downloadEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string) { return this.regulatory.evidenceLinkDownload(user.id, this.scope(user), evidenceLinkId, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/submit-review')
  @Permissions('regulatory.evidence.review.submit')
  submitEvidenceReview(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.submitEvidenceReview(user.id, this.scope(user), evidenceLinkId, dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/verify')
  @Permissions('regulatory.evidence.review.verify')
  verifyEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.reviewEvidenceLink(user.id, this.scope(user), evidenceLinkId, 'Verified Foundation', dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/reject')
  @Permissions('regulatory.evidence.review.reject')
  rejectEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.reviewEvidenceLink(user.id, this.scope(user), evidenceLinkId, 'Rejected', dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/request-rework')
  @Permissions('regulatory.evidence.review.request_rework')
  reworkEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.reviewEvidenceLink(user.id, this.scope(user), evidenceLinkId, 'Rework Required', dto, user.permissions); }

  @Post('evidence/links/:evidenceLinkId/waive')
  @Permissions('regulatory.evidence.review.verify')
  waiveEvidenceLink(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Body() dto: Record<string, any>) { return this.regulatory.reviewEvidenceLink(user.id, this.scope(user), evidenceLinkId, 'Waived Foundation', dto, user.permissions); }

  @Get('evidence/review')
  @Permissions('regulatory.evidence.review.view')
  evidenceReviewQueue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceReviews(this.scope(user), query, user.permissions); }

  @Get('evidence/pending-review')
  @Permissions('regulatory.evidence.review.view')
  evidencePendingReview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'pending-review', query, user.permissions); }

  @Get('evidence/verified')
  @Permissions('regulatory.evidence.link.view')
  evidenceVerified(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'verified', query, user.permissions); }

  @Get('evidence/rejected')
  @Permissions('regulatory.evidence.link.view')
  evidenceRejected(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'rejected', query, user.permissions); }

  @Get('evidence/rework-required')
  @Permissions('regulatory.evidence.link.view')
  evidenceReworkRequired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'rework-required', query, user.permissions); }

  @Get('evidence/missing')
  @Permissions('regulatory.evidence.link.view')
  evidenceMissing(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'missing', query, user.permissions); }

  @Get('evidence/restricted')
  @Permissions('regulatory.evidence.restricted.view')
  evidenceRestricted(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'restricted', query, user.permissions); }

  @Get('evidence/stale')
  @Permissions('regulatory.evidence.stale.view')
  evidenceStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'stale', query, user.permissions); }

  @Get('evidence/expired')
  @Permissions('regulatory.evidence.stale.view')
  evidenceExpired(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceFilteredView(this.scope(user), 'expired', query, user.permissions); }

  @Get('evidence/requests')
  @Permissions('regulatory.evidence.request.view')
  evidenceRequests(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceRequests(this.scope(user), query, user.permissions); }

  @Post('evidence/requests')
  @Permissions('regulatory.evidence.request.create')
  createEvidenceRequest(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createEvidenceRequest(user.id, this.scope(user), dto, user.permissions); }

  @Get('evidence/requests/:requestId')
  @Permissions('regulatory.evidence.request.view')
  evidenceRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string) { return this.regulatory.getEvidenceRequest(this.scope(user), requestId, user.permissions); }

  @Patch('evidence/requests/:requestId')
  @Permissions('regulatory.evidence.request.create')
  updateEvidenceRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateEvidenceRequest(user.id, this.scope(user), requestId, dto, user.permissions); }

  @Post('evidence/requests/:requestId/fulfill')
  @Permissions('regulatory.evidence.request.fulfill')
  fulfillEvidenceRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: Record<string, any>) { return this.regulatory.fulfillEvidenceRequest(user.id, this.scope(user), requestId, dto, user.permissions); }

  @Post('evidence/requests/:requestId/cancel')
  @Permissions('regulatory.evidence.request.cancel')
  cancelEvidenceRequest(@CurrentUser() user: RequestUser, @Param('requestId') requestId: string, @Body() dto: Record<string, any>) { return this.regulatory.cancelEvidenceRequest(user.id, this.scope(user), requestId, dto, user.permissions); }

  @Get('evidence/gaps')
  @Permissions('regulatory.evidence.gap.view')
  evidenceGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceGaps(this.scope(user), query, user.permissions); }

  @Post('evidence/gaps/detect')
  @Permissions('regulatory.evidence.gap.create')
  detectEvidenceGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.detectEvidenceGaps(user.id, this.scope(user), dto, user.permissions); }

  @Post('evidence/gaps')
  @Permissions('regulatory.evidence.gap.create')
  createEvidenceGap(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createEvidenceGap(user.id, this.scope(user), dto, user.permissions); }

  @Get('evidence/gaps/:gapId')
  @Permissions('regulatory.evidence.gap.view')
  evidenceGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) { return this.regulatory.getEvidenceGap(this.scope(user), gapId, user.permissions); }

  @Patch('evidence/gaps/:gapId')
  @Permissions('regulatory.evidence.gap.edit')
  updateEvidenceGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateEvidenceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('evidence/gaps/:gapId/resolve')
  @Permissions('regulatory.evidence.gap.resolve')
  resolveEvidenceGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.resolveEvidenceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('evidence/gaps/:gapId/archive')
  @Permissions('regulatory.evidence.gap.edit')
  archiveEvidenceGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveEvidenceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('evidence/gaps/:gapId/create-action-foundation')
  @Permissions('regulatory.evidence.gap.create_action_foundation')
  evidenceGapActionFoundation(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.createActionFoundationForEvidenceGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Get('evidence/packages')
  @Permissions('regulatory.evidence.package.view')
  evidencePackages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidencePackages(this.scope(user), query, user.permissions); }

  @Post('evidence/packages')
  @Permissions('regulatory.evidence.package.prepare')
  createEvidencePackage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createEvidencePackage(user.id, this.scope(user), dto, user.permissions); }

  @Get('evidence/packages/:packageId')
  @Permissions('regulatory.evidence.package.view')
  evidencePackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string) { return this.regulatory.getEvidencePackage(this.scope(user), packageId, user.permissions); }

  @Patch('evidence/packages/:packageId')
  @Permissions('regulatory.evidence.package.prepare')
  updateEvidencePackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateEvidencePackage(user.id, this.scope(user), packageId, dto, user.permissions); }

  @Post('evidence/packages/:packageId/prepare')
  @Permissions('regulatory.evidence.package.prepare')
  prepareEvidencePackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Body() dto: Record<string, any>) { return this.regulatory.prepareEvidencePackage(user.id, this.scope(user), packageId, dto, user.permissions); }

  @Post('evidence/packages/:packageId/items')
  @Permissions('regulatory.evidence.package.prepare')
  addEvidenceToPackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Body() dto: Record<string, any>) { return this.regulatory.addEvidenceToPackage(user.id, this.scope(user), packageId, dto, user.permissions); }

  @Delete('evidence/packages/:packageId/items/:itemId')
  @Permissions('regulatory.evidence.package.prepare')
  removeEvidencePackageItem(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Param('itemId') itemId: string, @Body() dto: Record<string, any>) { return this.regulatory.removeEvidencePackageItem(user.id, this.scope(user), packageId, itemId, dto, user.permissions); }

  @Post('evidence/packages/:packageId/archive')
  @Permissions('regulatory.evidence.package.prepare')
  archiveEvidencePackage(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveEvidencePackage(user.id, this.scope(user), packageId, dto, user.permissions); }

  @Get('evidence/access-log')
  @Permissions('regulatory.evidence.access_log.view')
  evidenceAccessLog(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceAccessLog(this.scope(user), query, user.permissions); }

  @Get('evidence/links/:evidenceLinkId/chain-of-custody')
  @Permissions('regulatory.evidence.chain.view')
  evidenceChain(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string) { return this.regulatory.evidenceChain(this.scope(user), evidenceLinkId, user.permissions); }

  @Get('evidence/history')
  @Permissions('regulatory.evidence.history.view')
  evidenceHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.evidenceHistory(this.scope(user), query, user.permissions); }

  @Get('evidence/settings')
  @Permissions('regulatory.settings.view')
  evidenceSettings(@CurrentUser() user: RequestUser) { return this.regulatory.evidenceSettings(this.scope(user)); }

  @Patch('evidence/settings')
  @Permissions('regulatory.evidence.settings.edit')
  updateEvidenceSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.updateEvidenceSettings(user.id, this.scope(user), dto, user.permissions); }

  @Get('audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingRoot(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboard(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/dashboard')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardPhase6(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboard(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/dashboard/summary')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboardSummary(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/dashboard/by-site')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboardGroup(this.scope(user), 'site_id', query, user.permissions); }

  @Get('audit-mapping/dashboard/by-obligation')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardByObligation(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboardGroup(this.scope(user), 'obligation_id', query, user.permissions); }

  @Get('audit-mapping/dashboard/by-audit-program')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardByAuditProgram(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboardGroup(this.scope(user), 'audit_program_id', query, user.permissions); }

  @Get('audit-mapping/dashboard/by-coverage')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardByCoverage(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingDashboardGroup(this.scope(user), 'coverage_status', query, user.permissions); }

  @Get('audit-mapping/dashboard/gaps')
  @Permissions('regulatory.audit_mapping.gap.view')
  auditMappingDashboardGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingGaps(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/dashboard/stale')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingDashboardStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'stale', query, user.permissions); }

  @Get('audit-mapping/dashboard/recent')
  @Permissions('regulatory.audit_mapping.dashboard.view')
  auditMappingDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappings(this.scope(user), { ...query, sort: 'updated_at.desc', limit: query.limit ?? 10 }, user.permissions); }

  @Get('audit-mapping/register')
  @Permissions('regulatory.audit_mapping.register.view')
  auditMappingRegisterPhase6(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingRegister(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/summary')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingSummaryPhase6(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingSummary(this.scope(user), query, user.permissions); }

  @Post('audit-mapping')
  @Permissions('regulatory.audit_mapping.create')
  createAuditMappingPhase6(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createAuditMapping(user.id, this.scope(user), dto, user.permissions); }

  @Get('audit-mapping/matrix')
  @Permissions('regulatory.audit_mapping.matrix.view')
  auditMappingMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingMatrix(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/coverage')
  @Permissions('regulatory.audit_mapping.coverage.view')
  auditMappingCoverage(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingCoverage(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/traceability')
  @Permissions('regulatory.audit_mapping.traceability.view')
  auditMappingTraceability(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingTraceability(this.scope(user), query, user.permissions); }

  @Post('audit-mapping/traceability/snapshot')
  @Permissions('regulatory.audit_mapping.traceability.view')
  createAuditMappingTraceabilitySnapshot(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createAuditTraceabilitySnapshot(user.id, this.scope(user), dto, user.permissions); }

  @Get('audit-mapping/ready-for-audit')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingReady(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'ready-for-audit', query, user.permissions); }

  @Get('audit-mapping/not-ready-for-audit')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingNotReady(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'not-ready-for-audit', query, user.permissions); }

  @Get('audit-mapping/unmapped')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingUnmapped(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'unmapped', query, user.permissions); }

  @Get('audit-mapping/stale')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'stale', query, user.permissions); }

  @Get('audit-mapping/missing-checklist')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingMissingChecklist(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'missing-checklist', query, user.permissions); }

  @Get('audit-mapping/missing-evidence')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingMissingEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'missing-evidence', query, user.permissions); }

  @Get('audit-mapping/missing-finding-link')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingMissingFindingLink(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'missing-finding-link', query, user.permissions); }

  @Get('audit-mapping/missing-capa-link')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingMissingCapaLink(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'missing-capa-link', query, user.permissions); }

  @Get('audit-mapping/missing-score-link')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingMissingScoreLink(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingFilteredView(this.scope(user), 'missing-score-link', query, user.permissions); }

  @Get('audit-mapping/gaps')
  @Permissions('regulatory.audit_mapping.gap.view')
  auditMappingGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingGaps(this.scope(user), query, user.permissions); }

  @Post('audit-mapping/gaps/detect')
  @Permissions('regulatory.audit_mapping.gap.create')
  detectAuditMappingGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.detectAuditMappingGaps(user.id, this.scope(user), dto, user.permissions); }

  @Post('audit-mapping/gaps')
  @Permissions('regulatory.audit_mapping.gap.create')
  createAuditMappingGap(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.createAuditMappingGap(user.id, this.scope(user), dto, user.permissions); }

  @Get('audit-mapping/gaps/:gapId')
  @Permissions('regulatory.audit_mapping.gap.view')
  auditMappingGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string) { return this.regulatory.getAuditMappingGap(this.scope(user), gapId, user.permissions); }

  @Patch('audit-mapping/gaps/:gapId')
  @Permissions('regulatory.audit_mapping.gap.edit')
  updateAuditMappingGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateAuditMappingGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('audit-mapping/gaps/:gapId/resolve')
  @Permissions('regulatory.audit_mapping.gap.resolve')
  resolveAuditMappingGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.resolveAuditMappingGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('audit-mapping/gaps/:gapId/archive')
  @Permissions('regulatory.audit_mapping.gap.edit')
  archiveAuditMappingGap(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveAuditMappingGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Post('audit-mapping/gaps/:gapId/create-action-foundation')
  @Permissions('regulatory.audit_mapping.gap.create_action_foundation')
  auditMappingGapActionFoundation(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Body() dto: Record<string, any>) { return this.regulatory.createActionFoundationForAuditMappingGap(user.id, this.scope(user), gapId, dto, user.permissions); }

  @Get('audit-mapping/history')
  @Permissions('regulatory.audit_mapping.history.view')
  auditMappingHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.auditMappingHistory(this.scope(user), query, user.permissions); }

  @Get('audit-mapping/settings')
  @Permissions('regulatory.settings.view')
  auditMappingSettings(@CurrentUser() user: RequestUser) { return this.regulatory.auditMappingSettings(this.scope(user)); }

  @Patch('audit-mapping/settings')
  @Permissions('regulatory.audit_mapping.settings.edit')
  updateAuditMappingSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.regulatory.updateAuditMappingSettings(user.id, this.scope(user), dto, user.permissions); }

  @Get('audit-mapping/:mappingId')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingDetailPhase6(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.getAuditMapping(this.scope(user), mappingId, user.permissions, true); }

  @Patch('audit-mapping/:mappingId')
  @Permissions('regulatory.audit_mapping.edit')
  updateAuditMappingPhase6(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.updateAuditMapping(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Post('audit-mapping/:mappingId/verify')
  @Permissions('regulatory.audit_mapping.verify')
  verifyAuditMappingPhase6(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.verifyAuditMapping(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Post('audit-mapping/:mappingId/reject')
  @Permissions('regulatory.audit_mapping.reject')
  rejectAuditMappingPhase6(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.rejectAuditMapping(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Post('audit-mapping/:mappingId/recalculate-coverage')
  @Permissions('regulatory.audit_mapping.coverage.recalculate')
  recalculateAuditMappingCoverage(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.recalculateAuditMappingCoverage(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Post('audit-mapping/:mappingId/refresh-snapshot')
  @Permissions('regulatory.audit_mapping.refresh_snapshot')
  refreshAuditMappingSnapshot(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.refreshAuditMappingSnapshot(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Post('audit-mapping/:mappingId/mark-stale')
  @Permissions('regulatory.audit_mapping.mark_stale')
  markAuditMappingStale(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.markAuditMappingStale(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Post('audit-mapping/:mappingId/archive')
  @Permissions('regulatory.audit_mapping.archive')
  archiveAuditMappingPhase6(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.archiveAuditMapping(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Get('audit-mapping/:mappingId/overview')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingOverview(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingOverview(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/source')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingSource(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingSource(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/audit-links')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingAuditLinks(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingAuditLinks(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/coverage')
  @Permissions('regulatory.audit_mapping.coverage.view')
  auditMappingDetailCoverage(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingCoverage(this.scope(user), { mappingId }, user.permissions); }

  @Get('audit-mapping/:mappingId/traceability')
  @Permissions('regulatory.audit_mapping.traceability.view')
  auditMappingDetailTraceability(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingTraceability(this.scope(user), { mappingId }, user.permissions); }

  @Get('audit-mapping/:mappingId/evidence')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingDetailEvidence(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingEvidence(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/findings')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingDetailFindings(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingFindings(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/capa')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingDetailCapa(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingCapa(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/scoring')
  @Permissions('regulatory.audit_mapping.view')
  auditMappingDetailScoring(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingScoring(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/review')
  @Permissions('regulatory.audit_mapping.review.view')
  auditMappingDetailReview(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.getAuditMapping(this.scope(user), mappingId, user.permissions, true); }

  @Post('audit-mapping/:mappingId/review')
  @Permissions('regulatory.audit_mapping.review.submit')
  submitAuditMappingReview(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.submitAuditMappingReview(user.id, this.scope(user), mappingId, dto, user.permissions); }

  @Get('audit-mapping/:mappingId/reports')
  @Permissions('regulatory.report.view')
  auditMappingDetailReports(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingReports(this.scope(user), mappingId, user.permissions); }

  @Get('audit-mapping/:mappingId/history')
  @Permissions('regulatory.audit_mapping.history.view')
  auditMappingDetailHistory(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string) { return this.regulatory.auditMappingHistory(this.scope(user), { mappingId }, user.permissions); }

  @Post('audit-mapping/:mappingId/link-audit-program')
  @Permissions('regulatory.audit_mapping.link_audit_program')
  auditMappingLinkProgram(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Program', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-audit-plan')
  @Permissions('regulatory.audit_mapping.link_audit_plan')
  auditMappingLinkPlan(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Plan', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-checklist')
  @Permissions('regulatory.audit_mapping.link_checklist')
  auditMappingLinkChecklist(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Checklist', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-execution')
  @Permissions('regulatory.audit_mapping.link_execution')
  auditMappingLinkExecution(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Execution', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-finding')
  @Permissions('regulatory.audit_mapping.link_finding')
  auditMappingLinkFinding(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Finding', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-capa')
  @Permissions('regulatory.audit_mapping.link_capa')
  auditMappingLinkCapa(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit CAPA', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-evidence')
  @Permissions('regulatory.audit_mapping.link_evidence')
  auditMappingLinkEvidence(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Evidence', dto, user.permissions); }

  @Post('audit-mapping/:mappingId/link-score')
  @Permissions('regulatory.audit_mapping.link_score')
  auditMappingLinkScore(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Body() dto: Record<string, any>) { return this.regulatory.linkAuditMappingTarget(user.id, this.scope(user), mappingId, 'Audit Score', dto, user.permissions); }

  @Delete('audit-mapping/:mappingId/links/:linkId')
  @Permissions('regulatory.audit_mapping.edit')
  auditMappingRemoveLink(@CurrentUser() user: RequestUser, @Param('mappingId') mappingId: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) { return this.regulatory.removeAuditMappingLink(user.id, this.scope(user), mappingId, linkId, dto, user.permissions); }

  @Get('obligations/:obligationId/evidence')
  @Permissions('regulatory.evidence.link.view')
  obligationEvidencePhase5(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidence(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/evidence/requirements')
  @Permissions('regulatory.evidence.requirement.view')
  obligationEvidenceRequirements(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidenceRequirements(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/evidence/links')
  @Permissions('regulatory.evidence.link.view')
  obligationEvidenceLinks(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidence(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/evidence/gaps')
  @Permissions('regulatory.evidence.gap.view')
  obligationEvidenceGaps(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidenceGaps(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('obligations/:obligationId/evidence/package')
  @Permissions('regulatory.evidence.package.view')
  obligationEvidencePackage(@CurrentUser() user: RequestUser, @Param('obligationId') obligationId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidencePackage(this.scope(user), 'obligation', obligationId, query, user.permissions); }

  @Get('compliance-status/assessments/:assessmentId/evidence')
  @Permissions('regulatory.evidence.link.view')
  complianceAssessmentEvidence(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidence(this.scope(user), 'complianceAssessment', assessmentId, query, user.permissions); }

  @Get('compliance-status/gaps/:gapId/evidence')
  @Permissions('regulatory.evidence.link.view')
  complianceGapEvidence(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidence(this.scope(user), 'complianceGap', gapId, query, user.permissions); }

  @Get('compliance-status/assessments/:assessmentId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  complianceAssessmentAuditMapping(@CurrentUser() user: RequestUser, @Param('assessmentId') assessmentId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditMappings(this.scope(user), 'complianceAssessment', assessmentId, query, user.permissions); }

  @Get('compliance-status/gaps/:gapId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  complianceGapAuditMapping(@CurrentUser() user: RequestUser, @Param('gapId') gapId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditMappings(this.scope(user), 'complianceGap', gapId, query, user.permissions); }

  @Get('evidence/links/:evidenceLinkId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  evidenceLinkAuditMapping(@CurrentUser() user: RequestUser, @Param('evidenceLinkId') evidenceLinkId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditMappings(this.scope(user), 'evidenceLink', evidenceLinkId, query, user.permissions); }

  @Get('evidence/packages/:packageId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  evidencePackageAuditMapping(@CurrentUser() user: RequestUser, @Param('packageId') packageId: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditMappings(this.scope(user), 'evidencePackage', packageId, query, user.permissions); }

  @Get('sites/:siteId/evidence')
  @Permissions('regulatory.evidence.link.view')
  siteEvidence(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedEvidence(this.scope(user), 'siteId', siteId, query, user.permissions); }

  @Get('sites/:siteId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  siteAuditMapping(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedAuditMappings(this.scope(user), 'siteId', siteId, query, user.permissions); }

  @Get('units/:unitId/evidence')
  @Permissions('regulatory.evidence.link.view')
  unitEvidence(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedEvidence(this.scope(user), 'unitId', unitId, query, user.permissions); }

  @Get('units/:unitId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  unitAuditMapping(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedAuditMappings(this.scope(user), 'unitId', unitId, query, user.permissions); }

  @Get('areas/:areaId/evidence')
  @Permissions('regulatory.evidence.link.view')
  areaEvidence(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedEvidence(this.scope(user), 'areaId', areaId, query, user.permissions); }

  @Get('areas/:areaId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  areaAuditMapping(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedAuditMappings(this.scope(user), 'areaId', areaId, query, user.permissions); }

  @Get('equipment/:equipmentId/evidence')
  @Permissions('regulatory.evidence.link.view')
  equipmentEvidence(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedEvidence(this.scope(user), 'equipmentId', equipmentId, query, user.permissions); }

  @Get('equipment/:equipmentId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  equipmentAuditMapping(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) { return this.regulatory.scopedAuditMappings(this.scope(user), 'equipmentId', equipmentId, query, user.permissions); }

  @Get('active')
  @Permissions('regulatory.register.view')
  active(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'active', query); }

  @Get('draft')
  @Permissions('regulatory.register.view')
  draft(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'draft', query); }

  @Get('under-review')
  @Permissions('regulatory.register.view')
  underReview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'under-review', query); }

  @Get('not-applicable')
  @Permissions('regulatory.register.view')
  notApplicable(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'not-applicable', query); }

  @Get('superseded')
  @Permissions('regulatory.register.view')
  superseded(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'superseded', query); }

  @Get('archived')
  @Permissions('regulatory.register.view')
  archived(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'archived', query); }

  @Get('overdue-review')
  @Permissions('regulatory.register.view')
  overdueReview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'overdue-review', query); }

  @Get('effective-soon')
  @Permissions('regulatory.register.view')
  effectiveSoonView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'effective-soon', query); }

  @Get('missing-owner')
  @Permissions('regulatory.register.view')
  missingOwnerView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'missing-owner', query); }

  @Get('missing-applicability')
  @Permissions('regulatory.register.view')
  missingApplicabilityView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'missing-applicability', query); }

  @Get('missing-evidence')
  @Permissions('regulatory.register.view')
  missingEvidenceView(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'missing-evidence', query); }

  @Get('non-compliant')
  @Permissions('regulatory.register.view')
  nonCompliant(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'non-compliant', query); }

  @Get('high-risk')
  @Permissions('regulatory.register.view')
  highRisk(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'high-risk', query); }

  @Get('psm-critical')
  @Permissions('regulatory.register.view')
  psmCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'psm-critical', query); }

  @Get('environmental-critical')
  @Permissions('regulatory.register.view')
  environmentalCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'environmental-critical', query); }

  @Get('safety-critical')
  @Permissions('regulatory.register.view')
  safetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.regulatory.filteredView(this.scope(user), 'safety-critical', query); }

  @Get('sites/:siteId')
  @Permissions('regulatory.register.view')
  bySiteScoped(@CurrentUser() user: RequestUser, @Param('siteId') siteId: string, @Query() query: Record<string, any>) {
    return this.regulatory.scoped(this.scope(user), 'siteId', siteId, query);
  }

  @Get('units/:unitId')
  @Permissions('regulatory.register.view')
  byUnitScoped(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: Record<string, any>) {
    return this.regulatory.scoped(this.scope(user), 'unitId', unitId, query);
  }

  @Get('areas/:areaId')
  @Permissions('regulatory.register.view')
  byAreaScoped(@CurrentUser() user: RequestUser, @Param('areaId') areaId: string, @Query() query: Record<string, any>) {
    return this.regulatory.scoped(this.scope(user), 'areaId', areaId, query);
  }

  @Get('equipment/:equipmentId')
  @Permissions('regulatory.register.view')
  byEquipmentScoped(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: Record<string, any>) {
    return this.regulatory.scoped(this.scope(user), 'equipmentId', equipmentId, query);
  }

  @Get(':regulationId')
  @Permissions('regulatory.item.view')
  detail(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) {
    return this.regulatory.overview(this.scope(user), id);
  }

  @Patch(':regulationId')
  @Permissions('regulatory.item.edit')
  update(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.update(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/archive')
  @Permissions('regulatory.item.archive')
  archive(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.archive(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/reactivate')
  @Permissions('regulatory.item.reactivate')
  reactivate(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.reactivate(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/lock')
  @Permissions('regulatory.item.lock')
  lock(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.lock(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/unlock')
  @Permissions('regulatory.item.unlock')
  unlock(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.unlock(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/assign-owner')
  @Permissions('regulatory.item.assign_owner')
  assignOwner(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.assignOwner(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/change-status')
  @Permissions('regulatory.item.change_status')
  changeStatus(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.changeStatus(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/change-applicability')
  @Permissions('regulatory.item.change_applicability')
  changeApplicability(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.changeApplicability(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/change-compliance-status')
  @Permissions('regulatory.item.change_compliance_status')
  changeCompliance(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.changeComplianceStatus(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Get(':regulationId/overview')
  @Permissions('regulatory.item.view')
  overview(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.overview(this.scope(user), id); }

  @Get(':regulationId/scope')
  @Permissions('regulatory.scope.view')
  scopeSection(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.itemSection(this.scope(user), id, 'scope'); }

  @Patch(':regulationId/scope')
  @Permissions('regulatory.scope.manage')
  updateScope(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.updateScope(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Get(':regulationId/applicability')
  @Permissions('regulatory.applicability.view')
  applicability(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.itemApplicability(this.scope(user), id); }

  @Post(':regulationId/applicability/new-assessment')
  @Permissions('regulatory.applicability.assessment.create')
  createItemApplicabilityAssessment(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createItemApplicabilityAssessment(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/applicability/decision')
  @Permissions('regulatory.applicability.decision.make')
  itemApplicabilityDecision(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.saveItemApplicabilityDecision(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Get(':regulationId/jurisdictions')
  @Permissions('regulatory.jurisdiction.view')
  itemJurisdictionsView(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.itemApplicabilityJurisdictions(this.scope(user), id); }

  @Get(':regulationId/obligations')
  @Permissions('regulatory.obligation.register.view')
  obligations(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.itemObligations(this.scope(user), id, query); }

  @Post(':regulationId/obligations')
  @Permissions('regulatory.obligation.create')
  createItemObligation(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) { return this.regulatory.createObligation(user.id, this.scope(user), { ...dto, regulatoryItemId: id }, user.permissions); }

  @Get(':regulationId/obligations/matrix')
  @Permissions('regulatory.obligation.matrix.view')
  itemObligationMatrix(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.itemObligationMatrix(this.scope(user), id, query); }

  @Get(':regulationId/obligations/gaps')
  @Permissions('regulatory.obligation.gap.view')
  itemObligationGaps(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.itemObligationGaps(this.scope(user), id, query); }

  @Get(':regulationId/compliance-status')
  @Permissions('regulatory.compliance.assessment.view')
  complianceStatus(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceCompliance(this.scope(user), 'item', id, query); }

  @Get(':regulationId/compliance-status/new-assessment')
  @Permissions('regulatory.compliance.assessment.create')
  newItemComplianceAssessment(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.createSourceComplianceAssessment(user.id, this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/compliance-status/gaps')
  @Permissions('regulatory.compliance.gap.view')
  itemComplianceGaps(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceComplianceGaps(this.scope(user), 'item', id, query); }

  @Get(':regulationId/compliance-status/history')
  @Permissions('regulatory.compliance.history.view')
  itemComplianceHistory(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceComplianceHistory(this.scope(user), 'item', id, query); }

  @Get(':regulationId/evidence/requirements')
  @Permissions('regulatory.evidence.requirement.view')
  itemEvidenceRequirements(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidenceRequirements(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/evidence/links')
  @Permissions('regulatory.evidence.link.view')
  itemEvidenceLinks(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidence(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/evidence/gaps')
  @Permissions('regulatory.evidence.gap.view')
  itemEvidenceGaps(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidenceGaps(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/evidence/package')
  @Permissions('regulatory.evidence.package.view')
  itemEvidencePackage(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidencePackage(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/evidence')
  @Permissions('regulatory.evidence.link.view')
  itemEvidence(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceEvidence(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/audit-mapping')
  @Permissions('regulatory.audit_mapping.view')
  auditMapping(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditMappings(this.scope(user), 'item', id, query, user.permissions); }

  @Post(':regulationId/audit-mapping')
  @Permissions('regulatory.audit_mapping.create')
  createItemAuditMapping(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) { return this.regulatory.createSourceAuditMapping(user.id, this.scope(user), 'item', id, dto, user.permissions); }

  @Get(':regulationId/audit-mapping/coverage')
  @Permissions('regulatory.audit_mapping.coverage.view')
  itemAuditMappingCoverage(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditCoverage(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/audit-mapping/traceability')
  @Permissions('regulatory.audit_mapping.traceability.view')
  itemAuditMappingTraceability(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditTraceability(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/audit-mapping/gaps')
  @Permissions('regulatory.audit_mapping.gap.view')
  itemAuditMappingGaps(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) { return this.regulatory.sourceAuditGaps(this.scope(user), 'item', id, query, user.permissions); }

  @Get(':regulationId/actions')
  @Permissions('regulatory.action.view')
  actions(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActions(this.scope(user), 'Regulatory Item', id, query, user.permissions);
  }

  @Post(':regulationId/actions')
  @Permissions('regulatory.action.create')
  createItemAction(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createSourceRegulatoryAction(user.id, this.scope(user), 'Regulatory Item', id, dto, user.permissions);
  }

  @Post(':regulationId/actions/link-existing')
  @Permissions('regulatory.action.link_existing')
  linkExistingItemAction(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.linkExistingRegulatoryAction(user.id, this.scope(user), { ...dto, sourceType: 'Regulatory Item', regulatoryItemId: id, sourceRecordId: id }, user.permissions);
  }

  @Get(':regulationId/actions/closure-readiness')
  @Permissions('regulatory.action.closure_readiness.view')
  itemActionsClosureReadiness(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Query() query: Record<string, any>) {
    return this.regulatory.sourceRegulatoryActionClosureReadiness(this.scope(user), 'Regulatory Item', id, query, user.permissions);
  }

  @Get(':regulationId/review')
  @Permissions('regulatory.review.view')
  review(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.itemSection(this.scope(user), id, 'review'); }

  @Get(':regulationId/reports')
  @Permissions('regulatory.report.view')
  reports(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.itemSection(this.scope(user), id, 'reports'); }

  @Get(':regulationId/history')
  @Permissions('regulatory.history.view')
  itemHistory(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.itemHistory(this.scope(user), id); }

  @Get(':regulationId/links')
  @Permissions('regulatory.link.view')
  links(@CurrentUser() user: RequestUser, @Param('regulationId') id: string) { return this.regulatory.links(this.scope(user), id); }

  @Post(':regulationId/links')
  @Permissions('regulatory.link.manage')
  createLink(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.createLink(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Delete(':regulationId/links/:linkId')
  @Permissions('regulatory.link.manage')
  removeLink(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.removeLink(user.id, this.scope(user), id, linkId, dto, user.permissions);
  }

  @Post(':regulationId/link-audit-mapping')
  @Permissions('regulatory.audit_mapping.link')
  linkAudit(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.linkAudit(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/link-evidence')
  @Permissions('regulatory.evidence.link')
  linkEvidence(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.linkEvidence(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/link-action')
  @Permissions('regulatory.action.link')
  linkAction(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.linkAction(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Post(':regulationId/jurisdictions')
  @Permissions('regulatory.jurisdiction.edit')
  linkJurisdiction(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Body() dto: Record<string, any>) {
    return this.regulatory.linkJurisdiction(user.id, this.scope(user), id, dto, user.permissions);
  }

  @Delete(':regulationId/jurisdictions/:linkId')
  @Permissions('regulatory.jurisdiction.edit')
  unlinkJurisdiction(@CurrentUser() user: RequestUser, @Param('regulationId') id: string, @Param('linkId') linkId: string, @Body() dto: Record<string, any>) {
    return this.regulatory.unlinkJurisdiction(user.id, this.scope(user), id, linkId, dto, user.permissions);
  }

  private scope(user: RequestUser) {
    return {
      companyId: user.tenantId,
      selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
      siteIds: user.siteIds,
      corporateView: user.corporateView,
      isCompanyAdmin: user.isCompanyAdmin,
      isSiteAdmin: user.isSiteAdmin
    };
  }
}
