import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PsiReviewApprovalService } from './psi-review-approval.service';

type QueryMap = Record<string, string | undefined>;

function sendCsv(response: any, payload: { fileName: string; content: string }) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('psi-review-approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information/review-approval')
export class PsiReviewApprovalController {
  constructor(private readonly approvals: PsiReviewApprovalService) {}

  @Get()
  @Permissions('psi.review.view')
  index(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.dashboard(user, query); }

  @Get('dashboard')
  @Permissions('psi.review.dashboard.view')
  dashboard(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.dashboard(user, query); }

  @Get('inbox')
  @Permissions('psi.review.inbox.view')
  inbox(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.inbox(user, query); }

  @Get('my-submissions')
  @Permissions('psi.review.view')
  mySubmissions(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.mySubmissions(user, query); }

  @Get('pending')
  @Permissions('psi.review.view')
  pending(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.pending(user, query); }

  @Get('overdue')
  @Permissions('psi.review.view')
  overdue(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.overdue(user, query); }

  @Get('returned')
  @Permissions('psi.review.view')
  returned(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.returned(user, query); }

  @Get('rejected')
  @Permissions('psi.review.view')
  rejected(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.rejected(user, query); }

  @Get('approved')
  @Permissions('psi.review.view')
  approved(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.approved(user, query); }

  @Get('completed')
  @Permissions('psi.review.view')
  completed(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.completed(user, query); }

  @Get('escalated')
  @Permissions('psi.review.view')
  escalated(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.escalated(user, query); }

  @Get('validation-failures')
  @Permissions('psi.review.view')
  validationFailures(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.validationFailures(user, query); }

  @Get('packages')
  @Permissions('psi.review.snapshot.view')
  packages(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.register(user, query); }

  @Get('rules')
  @Permissions('psi.review.rule.view')
  rules(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.rules(user, query); }

  @Post('rules')
  @Permissions('psi.review.rule.create')
  createRule(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.approvals.createRule(user, body); }

  @Post('rules/apply-template')
  @Permissions('psi.review.rule.create')
  applyTemplate(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.approvals.applyTemplate(user, body); }

  @Get('rules/:ruleId')
  @Permissions('psi.review.rule.view')
  rule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.approvals.rules(user, { ruleId }).then((rows) => rows.find((row: any) => row.id === ruleId) ?? null); }

  @Patch('rules/:ruleId')
  @Permissions('psi.review.rule.edit')
  updateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() body: Record<string, any>) { return this.approvals.updateRule(user, ruleId, body); }

  @Post('rules/:ruleId/archive')
  @Permissions('psi.review.rule.archive')
  archiveRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() body: Record<string, any>) { return this.approvals.archiveRule(user, ruleId, body); }

  @Get('settings')
  @Permissions('psi.review.settings.view')
  settings(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.settings(user, query); }

  @Patch('settings')
  @Permissions('psi.review.settings.edit')
  updateSettings(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.approvals.updateSettings(user, body); }

  @Get('export')
  @Permissions('psi.review.export')
  async export(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) { return sendCsv(response, await this.approvals.exportRows(user, query)); }

  @Get(':approvalId')
  @Permissions('psi.review.view')
  detail(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.detail(user, approvalId); }

  @Get(':approvalId/review')
  @Permissions('psi.review.inbox.view')
  review(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.detail(user, approvalId); }

  @Get(':approvalId/package')
  @Permissions('psi.review.snapshot.view')
  approvalPackage(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.detail(user, approvalId).then((detail) => detail.package); }

  @Get(':approvalId/snapshot')
  @Permissions('psi.review.snapshot.view')
  snapshot(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.snapshots(user, approvalId); }

  @Get(':approvalId/diff')
  @Permissions('psi.review.snapshot.view')
  diff(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.diff(user, approvalId); }

  @Get(':approvalId/history')
  @Permissions('psi.review.history.view')
  history(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.history(user, approvalId); }

  @Post(':approvalId/withdraw')
  @Permissions('psi.review.withdraw')
  withdraw(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.withdraw(user, approvalId, body); }

  @Post(':approvalId/resubmit')
  @Permissions('psi.review.submit')
  resubmit(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.resubmit(user, approvalId, body); }

  @Post(':approvalId/validate')
  @Permissions('psi.review.submit')
  validate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.validate(user, approvalId); }

  @Get(':approvalId/validation-results')
  @Permissions('psi.review.view')
  validationResults(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.validationResults(user, approvalId); }

  @Post(':approvalId/approve')
  @Permissions('psi.review.approve')
  approve(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.approve(user, approvalId, body); }

  @Post(':approvalId/reject')
  @Permissions('psi.review.reject')
  reject(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.reject(user, approvalId, body); }

  @Post(':approvalId/return')
  @Permissions('psi.review.return')
  returnForChanges(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.returnForChanges(user, approvalId, body); }

  @Post(':approvalId/delegate')
  @Permissions('psi.review.delegate')
  delegate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.delegate(user, approvalId, body); }

  @Post(':approvalId/escalate')
  @Permissions('psi.review.escalate')
  escalate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.escalate(user, approvalId, body); }

  @Post(':approvalId/override')
  @Permissions('psi.review.override')
  override(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.override(user, approvalId, body); }

  @Get(':approvalId/comments')
  @Permissions('psi.review.view')
  comments(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.comments(user, approvalId); }

  @Post(':approvalId/comments')
  @Permissions('psi.review.comment')
  addComment(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.addComment(user, approvalId, body); }

  @Patch(':approvalId/comments/:commentId')
  @Permissions('psi.review.comment')
  updateComment(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Param('commentId') commentId: string, @Body() body: Record<string, any>) { return this.approvals.updateComment(user, approvalId, commentId, body); }

  @Delete(':approvalId/comments/:commentId')
  @Permissions('psi.review.comment')
  deleteComment(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Param('commentId') commentId: string) { return this.approvals.deleteComment(user, approvalId, commentId); }
}

@ApiTags('psi-review-approval-source')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information')
export class PsiReviewApprovalSourceController {
  constructor(private readonly approvals: PsiReviewApprovalService) {}

  @Post(':module/:recordId/submit-review')
  @Permissions('psi.review.submit')
  submit(@CurrentUser() user: RequestUser, @Param('module') module: string, @Param('recordId') recordId: string, @Body() body: Record<string, any>) { return this.approvals.submitReview(user, module, recordId, body); }

  @Get(':module/:recordId/review-approval')
  @Permissions('psi.review.view')
  status(@CurrentUser() user: RequestUser, @Param('module') module: string, @Param('recordId') recordId: string) { return this.approvals.sourceReviewStatus(user, module, recordId); }

  @Get(':module/:recordId/approval-history')
  @Permissions('psi.review.history.view')
  approvalHistory(@CurrentUser() user: RequestUser, @Param('module') module: string, @Param('recordId') recordId: string) { return this.approvals.sourceApprovalHistory(user, module, recordId); }

  @Get('lookups/psi-approval-statuses')
  @Permissions('psi.review.view')
  statuses() { return this.approvals.lookups().approvalStatuses; }

  @Get('lookups/psi-approval-stages')
  @Permissions('psi.review.view')
  stages() { return this.approvals.lookups().approvalStages; }

  @Get('lookups/psi-approval-types')
  @Permissions('psi.review.view')
  types() { return this.approvals.lookups().approvalTypes; }

  @Get('lookups/psi-reviewable-modules')
  @Permissions('psi.review.view')
  modules() { return this.approvals.lookups().reviewableModules; }

  @Get('lookups/psi-decision-types')
  @Permissions('psi.review.view')
  decisions() { return this.approvals.lookups().decisionTypes; }

  @Get('lookups/psi-validation-statuses')
  @Permissions('psi.review.view')
  validationStatuses() { return this.approvals.lookups().validationStatuses; }
}

@ApiTags('psi-review-approval-scoped')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information/units/:unitId/review-approval')
export class PsiReviewApprovalUnitController {
  constructor(private readonly approvals: PsiReviewApprovalService) {}

  @Get()
  @Permissions('psi.review.view')
  unitIndex(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: QueryMap) { return this.approvals.register(user, { ...query, unitId }); }

  @Get('pending')
  @Permissions('psi.review.view')
  unitPending(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string, @Query() query: QueryMap) { return this.approvals.pending(user, { ...query, unitId }); }

  @Get('history')
  @Permissions('psi.review.history.view')
  unitHistory(@CurrentUser() user: RequestUser, @Param('unitId') unitId: string) { return this.approvals.register(user, { unitId, sort: 'updated_at.desc' }); }
}

@ApiTags('psi-review-approval-equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('process-safety-information/equipment/:equipmentId/review-approval')
export class PsiReviewApprovalEquipmentController {
  constructor(private readonly approvals: PsiReviewApprovalService) {}

  @Get()
  @Permissions('psi.review.view')
  equipmentIndex(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.approvals.register(user, { ...query, equipmentId }); }
}
