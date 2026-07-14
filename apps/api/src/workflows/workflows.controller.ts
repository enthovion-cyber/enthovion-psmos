import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { ApproveStepDto, RejectStepDto, ReturnStepDto } from './dto/approve-step.dto';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { OverrideWorkflowDto } from './dto/override-workflow.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get('templates')
  @Permissions(PermissionKeys.WorkflowView)
  templates(@CurrentUser() user: RequestUser, @Query('module') module?: string) {
    return this.workflows.listTemplates(user.tenantId, this.scope(user), module);
  }

  @Get('templates/:id')
  @Permissions(PermissionKeys.WorkflowView)
  template(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.getTemplate(user.tenantId, id, this.scope(user));
  }

  @Post('templates')
  @Permissions(PermissionKeys.WorkflowManageTemplates)
  createTemplate(@CurrentUser() user: RequestUser, @Body() dto: CreateWorkflowTemplateDto) {
    return this.workflows.createTemplate(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('templates/:id')
  @Permissions(PermissionKeys.WorkflowManageTemplates)
  updateTemplate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateWorkflowTemplateDto) {
    return this.workflows.updateTemplate(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete('templates/:id')
  @Permissions(PermissionKeys.WorkflowDelete)
  deleteTemplate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.deleteTemplate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post('templates/:id/clone')
  @Permissions(PermissionKeys.WorkflowManageTemplates)
  clone(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.cloneTemplate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post('templates/:id/activate')
  @Permissions(PermissionKeys.WorkflowManageTemplates)
  activate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.activateTemplate(user.tenantId, user.id, id, this.scope(user), true);
  }

  @Post('templates/:id/deactivate')
  @Permissions(PermissionKeys.WorkflowManageTemplates)
  deactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.activateTemplate(user.tenantId, user.id, id, this.scope(user), false);
  }

  @Post('templates/:id/set-default')
  @Permissions(PermissionKeys.WorkflowManageTemplates)
  setDefault(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.setDefaultTemplate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post('start')
  @Permissions(PermissionKeys.WorkflowCreate)
  start(@CurrentUser() user: RequestUser, @Body() dto: StartWorkflowDto) {
    return this.workflows.startWorkflow(user.tenantId, user.id, dto, this.scope(user));
  }

  @Get('record/:module/:recordId')
  @Permissions(PermissionKeys.WorkflowView)
  record(@CurrentUser() user: RequestUser, @Param('module') module: string, @Param('recordId') recordId: string) {
    return this.workflows.forRecord(user.tenantId, module, recordId, this.scope(user));
  }

  @Get('overdue')
  @Permissions(PermissionKeys.WorkflowView)
  overdue(@CurrentUser() user: RequestUser) {
    return this.workflows.overdue(user.tenantId, this.scope(user));
  }

  @Get(':id')
  @Permissions(PermissionKeys.WorkflowView)
  instance(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.getInstance(user.tenantId, id, this.scope(user));
  }

  @Get(':id/history')
  @Permissions(PermissionKeys.WorkflowView)
  history(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.getHistory(user.tenantId, id, this.scope(user));
  }

  @Post(':id/approve')
  @Permissions(PermissionKeys.WorkflowApprove)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApproveStepDto) {
    return this.workflows.approve(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/reject')
  @Permissions(PermissionKeys.WorkflowReject)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RejectStepDto) {
    return this.workflows.reject(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/return')
  @Permissions(PermissionKeys.WorkflowReject)
  returnForRevision(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ReturnStepDto) {
    return this.workflows.returnForRevision(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/override')
  @Permissions(PermissionKeys.WorkflowOverride)
  override(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: OverrideWorkflowDto) {
    return this.workflows.override(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/escalate')
  @Permissions(PermissionKeys.WorkflowEdit)
  escalate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workflows.escalate(user.tenantId, user.id, id, this.scope(user));
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }
}
