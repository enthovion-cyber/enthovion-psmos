import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentCommentDto } from './dto/document-comment.dto';
import { DocumentDecisionDto, DocumentReasonDto, DocumentRejectDto } from './dto/document-decision.dto';
import { DocumentFilterDto } from './dto/document-filter.dto';
import { DocumentRelationDto } from './dto/document-relation.dto';
import { DocumentVersionDto } from './dto/document-version.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @Permissions(PermissionKeys.DocumentsRead)
  list(@CurrentUser() user: RequestUser, @Query() query: DocumentFilterDto) {
    return this.documents.list(user.tenantId, query, this.scope(user));
  }

  @Get('review-due')
  @Permissions(PermissionKeys.DocumentsRead)
  reviewDue(@CurrentUser() user: RequestUser) {
    return this.documents.reviewDue(user.tenantId);
  }

  @Get('overdue-reviews')
  @Permissions(PermissionKeys.DocumentsRead)
  overdue(@CurrentUser() user: RequestUser) {
    return this.documents.overdueReviews(user.tenantId);
  }

  @Get('folders')
  @Permissions(PermissionKeys.DocumentsRead)
  folders(@CurrentUser() user: RequestUser) {
    return this.documents.folders(user.tenantId);
  }

  @Get(':id')
  @Permissions(PermissionKeys.DocumentsRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.get(user.tenantId, id, this.scope(user));
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.DocumentsUpload)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateDocumentDto, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.documents.create(user.tenantId, user.id, { ...dto, siteId: this.requiredSiteId(user, dto.siteId) }, file, this.scope(user));
  }

  @Patch(':id')
  @Permissions(PermissionKeys.DocumentsEdit)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Delete(':id')
  @Permissions(PermissionKeys.DocumentsDelete)
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto?: DocumentReasonDto) {
    return this.documents.archive(user.tenantId, user.id, id, { reason: dto?.reason ?? 'Deleted by user request' }, this.scope(user));
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.DocumentsUpload)
  uploadVersion(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentVersionDto, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.documents.uploadVersion(user.tenantId, user.id, id, dto, file, this.scope(user));
  }

  @Get(':id/versions')
  @Permissions(PermissionKeys.DocumentsRead)
  versions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.versions(user.tenantId, id);
  }

  @Post(':id/submit-review')
  @Permissions(PermissionKeys.DocumentsEdit)
  submitReview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.submitReview(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/approve')
  @Permissions(PermissionKeys.DocumentsApprove)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentDecisionDto) {
    return this.documents.approve(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/reject')
  @Permissions(PermissionKeys.DocumentsApprove)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentRejectDto) {
    return this.documents.reject(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/activate')
  @Permissions(PermissionKeys.DocumentsApprove)
  activate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.activate(user.tenantId, user.id, id, this.scope(user));
  }

  @Post(':id/obsolete')
  @Permissions(PermissionKeys.DocumentsArchive)
  obsolete(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentReasonDto) {
    return this.documents.obsolete(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/archive')
  @Permissions(PermissionKeys.DocumentsArchive)
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentReasonDto) {
    return this.documents.archive(user.tenantId, user.id, id, dto, this.scope(user));
  }

  @Post(':id/relations')
  @Permissions(PermissionKeys.DocumentsLink)
  addRelation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentRelationDto) {
    return this.documents.addRelation(user.tenantId, user.id, id, dto);
  }

  @Get(':id/relations')
  @Permissions(PermissionKeys.DocumentsRead)
  relations(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.relations(user.tenantId, id);
  }

  @Delete(':id/relations/:relationId')
  @Permissions(PermissionKeys.DocumentsLink)
  deleteRelation(@CurrentUser() user: RequestUser, @Param('relationId') relationId: string) {
    return this.documents.deleteRelation(user.tenantId, user.id, relationId);
  }

  @Post(':id/comments')
  @Permissions(PermissionKeys.DocumentsComment)
  addComment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: DocumentCommentDto) {
    return this.documents.addComment(user.tenantId, user.id, id, dto);
  }

  @Patch('comments/:commentId')
  @Permissions(PermissionKeys.DocumentsComment)
  updateComment(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string, @Body() dto: DocumentCommentDto) {
    return this.documents.updateComment(user.tenantId, user.id, commentId, dto);
  }

  @Delete('comments/:commentId')
  @Permissions(PermissionKeys.DocumentsComment)
  deleteComment(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string) {
    return this.documents.deleteComment(user.tenantId, user.id, commentId);
  }

  @Get(':id/access-log')
  @Permissions(PermissionKeys.DocumentsRead)
  accessLog(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.accessLog(user.tenantId, id);
  }

  @Get(':id/preview')
  @Permissions(PermissionKeys.DocumentsRead)
  async preview(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() response: any) {
    const file = await this.documents.file(user.tenantId, user.id, id, 'preview', this.scope(user));
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`);
    response.send(file.buffer);
  }

  @Get(':id/download')
  @Permissions(PermissionKeys.DocumentsDownload)
  async download(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() response: any) {
    const file = await this.documents.file(user.tenantId, user.id, id, 'download', this.scope(user));
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName.replace(/"/g, '')}"`);
    response.send(file.buffer);
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }

  private requiredSiteId(user: RequestUser, siteId?: string) {
    const nextSiteId = siteId ?? user.selectedSiteId;
    if (!nextSiteId) throw new BadRequestException('Site is required');
    if (user.siteIds.length && !user.siteIds.includes(nextSiteId)) throw new BadRequestException('Site is outside your access scope');
    return nextSiteId;
  }
}
