import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { TrainingReviewApprovalService } from './training-review-approval.service';

type Dto = Record<string, any>;

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('training-competency')
export class TrainingReviewApprovalController {
  constructor(private readonly review: TrainingReviewApprovalService) {}

  @Get('review-approval') @Permissions('training.review.view') root(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.dashboard(user, query); }
  @Get('review-approval/dashboard') @Permissions('training.review.dashboard.view') dashboard(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.dashboard(user, query); }
  @Get('review-approval/dashboard/summary') @Permissions('training.review.dashboard.view') summary(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.dashboardSummary(user, query); }
  @Get('review-approval/dashboard/my-inbox-preview') @Permissions('training.review.inbox.view') inboxPreview(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.inbox(user, { ...query, limit: query.limit ?? 8 }); }
  @Get('review-approval/dashboard/overdue-preview') @Permissions('training.review.dashboard.view') overduePreview(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'overdue', { ...query, limit: query.limit ?? 8 }); }
  @Get('review-approval/dashboard/by-module') @Permissions('training.review.dashboard.view') byModule(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.dashboard(user, query).then((data) => data.pendingByModule); }

  @Get('review-approval/inbox') @Permissions('training.review.inbox.view') inbox(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.inbox(user, query); }
  @Get('review-approval/my-submissions') @Permissions('training.review.submission.view') submissions(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.submissions(user, query); }
  @Get('review-approval/pending') @Permissions('training.review.request.view') pending(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'pending', query); }
  @Get('review-approval/overdue') @Permissions('training.review.request.view') overdue(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'overdue', query); }
  @Get('review-approval/returned') @Permissions('training.review.request.view') returned(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'returned', query); }
  @Get('review-approval/rejected') @Permissions('training.review.request.view') rejected(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'rejected', query); }
  @Get('review-approval/approved') @Permissions('training.review.request.view') approved(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'approved', query); }
  @Get('review-approval/completed') @Permissions('training.review.request.view') completed(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'completed', query); }
  @Get('review-approval/escalated') @Permissions('training.review.request.view') escalated(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'escalated', query); }
  @Get('review-approval/stale') @Permissions('training.review.request.view') stale(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'stale', query); }
  @Get('review-approval/validation-failures') @Permissions('training.review.request.view') validationFailures(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.filtered(user, 'validation-failures', query); }

  @Post('review-approval/packages') @Permissions('training.review.request.create') createPackage(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.review.createPackage(user, dto); }
  @Get('review-approval/packages') @Permissions('training.review.request.view') packages(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.packages(user, query); }
  @Get('review-approval/packages/:approvalId') @Permissions('training.review.request.view') packageDetail(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.review.packageDetail(user, approvalId); }
  @Get('review-approval/packages/:approvalId/snapshot') @Permissions('training.review.request.view') snapshot(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.review.snapshot(user, approvalId); }
  @Get('review-approval/packages/:approvalId/evidence') @Permissions('training.review.request.view') evidence(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.review.evidence(user, approvalId); }
  @Get('review-approval/packages/:approvalId/history') @Permissions('training.review.history.view') packageHistory(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Query() query: Dto) { return this.review.history(user, { ...query, approvalId }); }
  @Post('review-approval/packages/:approvalId/validate') @Permissions('training.review.validate') validate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.validate(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/approve') @Permissions('training.review.approve') approve(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.approve(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/approve-with-conditions') @Permissions('training.review.approve') approveConditions(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.approveWithConditions(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/reject') @Permissions('training.review.reject') reject(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.reject(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/return') @Permissions('training.review.return') returnForCorrection(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.returnForCorrection(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/request-correction') @Permissions('training.review.return') requestCorrection(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.requestCorrection(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/escalate') @Permissions('training.review.escalate') escalate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.escalate(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/reassign') @Permissions('training.review.reassign') reassign(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.reassign(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/cancel') @Permissions('training.review.request.cancel') cancel(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.cancel(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/resubmit') @Permissions('training.review.request.resubmit') resubmit(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.resubmit(user, approvalId, dto); }
  @Post('review-approval/packages/:approvalId/comment') @Permissions('training.review.comment') comment(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() dto: Dto) { return this.review.comment(user, approvalId, dto); }

  @Get('review-approval/rules') @Permissions('training.review.rule.view') rules(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.rules(user, query); }
  @Post('review-approval/rules') @Permissions('training.review.rule.create') createRule(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.review.createRule(user, dto); }
  @Get('review-approval/rules/:ruleId') @Permissions('training.review.rule.view') rule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.review.ruleDetail(user, ruleId); }
  @Patch('review-approval/rules/:ruleId') @Permissions('training.review.rule.edit') updateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: Dto) { return this.review.updateRule(user, ruleId, dto); }
  @Post('review-approval/rules/:ruleId/archive') @Permissions('training.review.rule.archive') archiveRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() dto: Dto) { return this.review.archiveRule(user, ruleId, dto); }
  @Post('review-approval/rules/:ruleId/activate') @Permissions('training.review.rule.edit') activateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.review.activateRule(user, ruleId); }
  @Get('review-approval/esignatures') @Permissions('training.review.request.view') esignatures(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.esignatures(user, query); }
  @Get('review-approval/escalations') @Permissions('training.review.request.view') escalations(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.escalations(user, query); }
  @Get('review-approval/settings') @Permissions('training.review.settings.view') settings(@CurrentUser() user: RequestUser, @Query() query: Dto) { return this.review.settings(user, query); }
  @Patch('review-approval/settings') @Permissions('training.review.settings.edit') updateSettings(@CurrentUser() user: RequestUser, @Body() dto: Dto) { return this.review.updateSettings(user, dto); }
  @Get('lookups/training-approval-statuses') @Permissions('training.review.view') approvalStatuses() { return this.review.lookups('trainingApprovalStatuses'); }
  @Get('lookups/training-approval-source-modules') @Permissions('training.review.view') sourceModules() { return this.review.lookups('trainingApprovalSourceModules'); }
  @Get('lookups/training-approval-source-record-types') @Permissions('training.review.view') sourceRecordTypes() { return this.review.lookups('trainingApprovalSourceRecordTypes'); }
  @Get('lookups/training-approval-stage-types') @Permissions('training.review.view') stageTypes() { return this.review.lookups('trainingApprovalStageTypes'); }
  @Get('lookups/training-approval-decisions') @Permissions('training.review.view') decisions() { return this.review.lookups('trainingApprovalDecisions'); }
  @Get('lookups/training-approval-priorities') @Permissions('training.review.view') priorities() { return this.review.lookups('trainingApprovalPriorities'); }
  @Get('lookups/training-validation-statuses') @Permissions('training.review.view') validationStatuses() { return this.review.lookups('trainingValidationStatuses'); }
  @Get('lookups/training-stale-statuses') @Permissions('training.review.view') staleStatuses() { return this.review.lookups('trainingStaleStatuses'); }

  @Post('training-matrix/:ruleId/submit-review') @Permissions('training.review.request.create') submitMatrix(@CurrentUser() user: RequestUser, @Param('ruleId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Training Matrix', 'Matrix rule', id, dto); }
  @Post('roles-competency-profiles/profiles/:profileId/submit-review') @Permissions('training.review.request.create') submitProfile(@CurrentUser() user: RequestUser, @Param('profileId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Roles & Competency', 'Competency profile', id, dto); }
  @Post('required-training/library/:trainingId/submit-review') @Permissions('training.review.request.create') submitRequired(@CurrentUser() user: RequestUser, @Param('trainingId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Required Training', 'Training library item', id, dto); }
  @Post('training-records/records/:recordId/submit-review') @Permissions('training.review.request.create') submitRecord(@CurrentUser() user: RequestUser, @Param('recordId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Training Records', 'Safety-critical completion record', id, dto); }
  @Post('certifications/:certificateId/submit-review') @Permissions('training.review.request.create') submitCert(@CurrentUser() user: RequestUser, @Param('certificateId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Certifications', 'Certificate verification', id, dto); }
  @Post('assessments/results/:resultId/submit-review') @Permissions('training.review.request.create') submitAssessment(@CurrentUser() user: RequestUser, @Param('resultId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Assessments', 'Assessment result verification', id, dto); }
  @Post('sop-acknowledgements/acknowledgements/:acknowledgementId/submit-review') @Permissions('training.review.request.create') submitSop(@CurrentUser() user: RequestUser, @Param('acknowledgementId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'SOP Acknowledgements', 'Safety-critical SOP acknowledgement', id, dto); }
  @Post('moc-training-requirements/:requirementId/submit-review') @Permissions('training.review.request.create') submitMoc(@CurrentUser() user: RequestUser, @Param('requirementId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'MOC Training', 'MOC training requirement', id, dto); }
  @Post('pssr-training-readiness/:readinessId/submit-review') @Permissions('training.review.request.create') submitPssr(@CurrentUser() user: RequestUser, @Param('readinessId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'PSSR Training', 'PSSR training readiness record', id, dto); }
  @Post('ptw-role-authorization/authorizations/:authorizationId/submit-review') @Permissions('training.review.request.create') submitPtw(@CurrentUser() user: RequestUser, @Param('authorizationId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'PTW Authorization', 'PTW authorization record', id, dto); }
  @Post('reports/generated/:reportId/submit-review') @Permissions('training.review.request.create') submitReport(@CurrentUser() user: RequestUser, @Param('reportId') id: string, @Body() dto: Dto) { return this.review.sourceSubmit(user, 'Reports / Export', 'Restricted report export', id, dto); }
}
