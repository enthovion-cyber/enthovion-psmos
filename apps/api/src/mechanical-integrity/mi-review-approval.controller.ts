import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiReviewApprovalService } from './mi-review-approval.service';

type QueryMap = Record<string, string | undefined>;

function sendCsv(response: any, payload: { fileName: string; content: string }) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('mechanical-integrity-review-approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/review-approval')
export class MiReviewApprovalController {
  constructor(private readonly approvals: MiReviewApprovalService) {}

  @Get()
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  dashboard(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.dashboard(user, query); }

  @Get('summary')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  summary(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.summary(user, query); }

  @Get('inbox')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewInbox)
  inbox(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.inbox(user, query); }

  @Get('my-approvals')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewInbox)
  myApprovals(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.myApprovals(user, query); }

  @Get('pending')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  pending(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.pending(user, query); }

  @Get('overdue')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  overdue(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.overdue(user, query); }

  @Get('escalated')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  escalated(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.escalated(user, query); }

  @Get('completed')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  completed(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.completed(user, query); }

  @Get('export')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewExport)
  async exportRows(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) { return sendCsv(response, await this.approvals.exportRows(user, query)); }

  @Post('submit')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewSubmit)
  submit(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.approvals.submit(user, body); }

  @Get('config/rules')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewConfigureRules)
  rules(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.approvals.rules(user, query); }

  @Post('config/rules')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewConfigureRules)
  createRule(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.approvals.createRule(user, body); }

  @Patch('config/rules/:ruleId')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewConfigureRules)
  updateRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string, @Body() body: Record<string, any>) { return this.approvals.updateRule(user, ruleId, body); }

  @Post('config/rules/:ruleId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewConfigureRules)
  archiveRule(@CurrentUser() user: RequestUser, @Param('ruleId') ruleId: string) { return this.approvals.archiveRule(user, ruleId); }

  @Get(':approvalId')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  detail(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.detail(user, approvalId); }

  @Get(':approvalId/review')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewInbox)
  review(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.detail(user, approvalId); }

  @Get(':approvalId/export')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewExport)
  async exportOne(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Res() response: any) { return sendCsv(response, await this.approvals.exportOne(user, approvalId)); }

  @Post(':approvalId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewApprove)
  approve(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.approve(user, approvalId, body); }

  @Post(':approvalId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewReject)
  reject(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.reject(user, approvalId, body); }

  @Post(':approvalId/return-for-correction')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewReturn)
  returnForCorrection(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.returnForCorrection(user, approvalId, body); }

  @Post(':approvalId/approve-with-conditions')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewApprove)
  approveWithConditions(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.approveWithConditions(user, approvalId, body); }

  @Post(':approvalId/request-info')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewReturn)
  requestInfo(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.requestInfo(user, approvalId, body); }

  @Post(':approvalId/delegate')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewDelegate)
  delegate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.delegate(user, approvalId, body); }

  @Post(':approvalId/escalate')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewEscalate)
  escalate(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.escalate(user, approvalId, body); }

  @Post(':approvalId/cancel')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewSubmit)
  cancel(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.cancel(user, approvalId, body); }

  @Get(':approvalId/validations')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  validations(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.validations(user, approvalId); }

  @Post(':approvalId/run-validations')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewSubmit)
  runValidations(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.runValidations(user, approvalId); }

  @Post(':approvalId/validations/:validationId/override')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewOverrideValidation)
  overrideValidation(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Param('validationId') validationId: string, @Body() body: Record<string, any>) { return this.approvals.overrideValidation(user, approvalId, validationId, body); }

  @Get(':approvalId/change-summary')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  changeSummary(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.changeSummary(user, approvalId); }

  @Get(':approvalId/history')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  history(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.history(user, approvalId); }

  @Get(':approvalId/comments')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  comments(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.comments(user, approvalId); }

  @Post(':approvalId/comments')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewInbox)
  addComment(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.addComment(user, approvalId, body); }

  @Get(':approvalId/conditions')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  conditions(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string) { return this.approvals.conditions(user, approvalId); }

  @Post(':approvalId/conditions')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewApprove)
  addCondition(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Body() body: Record<string, any>) { return this.approvals.addCondition(user, approvalId, body); }

  @Post(':approvalId/conditions/:conditionId/close')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewApprove)
  closeCondition(@CurrentUser() user: RequestUser, @Param('approvalId') approvalId: string, @Param('conditionId') conditionId: string, @Body() body: Record<string, any>) { return this.approvals.closeCondition(user, approvalId, conditionId, body); }
}

@ApiTags('mechanical-integrity-review-approval-lookups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity/lookups')
export class MiReviewApprovalLookupsController {
  constructor(private readonly approvals: MiReviewApprovalService) {}

  @Get('approval-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  statuses() { return this.approvals.lookups().approvalStatuses; }

  @Get('approval-actions')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  actions() { return this.approvals.lookups().approvalActions; }

  @Get('approval-stages')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  stages() { return this.approvals.lookups().approvalStages; }

  @Get('approval-source-modules')
  @Permissions(PermissionKeys.MechanicalIntegrityReviewView)
  sourceModules() { return this.approvals.lookups().approvalSourceModules; }
}
