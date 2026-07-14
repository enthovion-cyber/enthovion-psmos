import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { ActionCommentDto } from './dto/action-comment.dto';
import { ActionEvidenceDto } from './dto/action-evidence.dto';
import { ActionFilterDto } from './dto/action-filter.dto';
import { CloseActionDto } from './dto/close-action.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { VerifyActionDto } from './dto/verify-action.dto';
import { ActionsService } from './actions.service';

@ApiTags('actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  @Get()
  @Permissions(PermissionKeys.ActionsRead)
  list(@CurrentUser() user: RequestUser, @Query() query: ActionFilterDto) {
    return this.actions.list(user.tenantId, user.id, this.scopedFilter(user, query), user.siteIds);
  }

  @Get('dashboard')
  @Permissions(PermissionKeys.ActionsRead)
  dashboard(@CurrentUser() user: RequestUser) {
    return this.actions.dashboard(user.tenantId, user.id, user.siteIds, user.selectedSiteId, user.corporateView);
  }

  @Get('aging-summary')
  @Permissions(PermissionKeys.ActionsRead)
  agingSummary(@CurrentUser() user: RequestUser) {
    return this.actions.agingSummary(user.tenantId, user.id, user.siteIds, user.selectedSiteId, user.corporateView);
  }

  @Get('export')
  @Permissions(PermissionKeys.ActionsExport)
  export(@CurrentUser() user: RequestUser, @Query() query: ActionFilterDto) {
    return this.actions.export(user.tenantId, user.id, this.scopedFilter(user, query), user.siteIds);
  }

  @Post('escalations/run')
  @Permissions(PermissionKeys.ActionsEdit)
  runEscalations(@CurrentUser() user: RequestUser) {
    return this.actions.runEscalations(user.tenantId, user.id);
  }

  @Get(':id')
  @Permissions(PermissionKeys.ActionsRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.actions.get(user.tenantId, id, user.siteIds);
  }

  @Post()
  @Permissions(PermissionKeys.ActionsManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateActionDto) {
    return this.actions.create(user.tenantId, user.id, { ...dto, siteId: this.requiredSiteId(user, dto.siteId) });
  }

  @Patch(':id')
  @Permissions(PermissionKeys.ActionsEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateActionDto) {
    return this.actions.update(user.tenantId, user.id, id, dto);
  }

  @Delete(':id')
  @Permissions(PermissionKeys.ActionsDelete)
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.actions.transition(user.tenantId, user.id, id, 'CANCELLED');
  }

  @Post(':id/comment')
  @Permissions(PermissionKeys.ActionsRead)
  addComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ActionCommentDto) {
    return this.actions.addComment(user.tenantId, user.id, id, dto);
  }

  @Patch('comments/:commentId')
  @Permissions(PermissionKeys.ActionsRead)
  updateComment(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string, @Body() dto: ActionCommentDto) {
    return this.actions.updateComment(user.tenantId, user.id, commentId, dto);
  }

  @Delete('comments/:commentId')
  @Permissions(PermissionKeys.ActionsRead)
  deleteComment(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string) {
    return this.actions.deleteComment(user.tenantId, user.id, commentId);
  }

  @Post(':id/evidence')
  @Permissions(PermissionKeys.ActionsEdit)
  addEvidence(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ActionEvidenceDto) {
    return this.actions.addEvidence(user.tenantId, user.id, id, dto);
  }

  @Delete('evidence/:evidenceId')
  @Permissions(PermissionKeys.ActionsEdit)
  deleteEvidence(@CurrentUser() user: RequestUser, @Param('evidenceId') evidenceId: string) {
    return this.actions.deleteEvidence(user.tenantId, user.id, evidenceId);
  }

  @Post(':id/verify')
  @Permissions(PermissionKeys.ActionsVerify)
  verify(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: VerifyActionDto) {
    return this.actions.verify(user.tenantId, user.id, id, dto);
  }

  @Post(':id/close')
  @Permissions(PermissionKeys.ActionsClose)
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CloseActionDto) {
    return this.actions.close(user.tenantId, user.id, id, dto);
  }

  @Post(':id/reopen')
  @Permissions(PermissionKeys.ActionsEdit)
  reopen(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.actions.transition(user.tenantId, user.id, id, 'IN_PROGRESS');
  }

  @Post(':id/watch')
  @Permissions(PermissionKeys.ActionsRead)
  watch(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.actions.watch(user.tenantId, user.id, id);
  }

  private scopedFilter(user: RequestUser, query: ActionFilterDto) {
    const siteId = user.selectedSiteId ?? query.siteId;
    if (siteId && user.siteIds.length && !user.siteIds.includes(siteId)) return { ...query, siteId: '__forbidden__' };
    return user.corporateView && !siteId ? query : { ...query, siteId };
  }

  private requiredSiteId(user: RequestUser, siteId?: string) {
    const nextSiteId = siteId ?? user.selectedSiteId;
    if (!nextSiteId) return siteId;
    if (user.siteIds.length && !user.siteIds.includes(nextSiteId)) return '__forbidden__';
    return nextSiteId;
  }
}
