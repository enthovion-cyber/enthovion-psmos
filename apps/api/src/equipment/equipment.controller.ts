import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { BulkImportDto } from './dto/bulk-import.dto';
import { CreateEquipmentInspectionDto } from './dto/create-equipment-inspection.dto';
import { CreateEquipmentNoteDto } from './dto/create-equipment-note.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentFilterDto } from './dto/equipment-filter.dto';
import { UpdateEquipmentInspectionDto } from './dto/update-equipment-inspection.dto';
import { UpdateEquipmentNoteDto } from './dto/update-equipment-note.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UploadEquipmentAttachmentDto } from './dto/upload-equipment-attachment.dto';
import { UploadEquipmentDocumentDto } from './dto/upload-equipment-document.dto';
import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipment: EquipmentService) {}

  @Get()
  @Permissions(PermissionKeys.EquipmentRead)
  list(@CurrentUser() user: RequestUser, @Query() query: EquipmentFilterDto) {
    return this.equipment.list(user.tenantId, this.scopedFilter(user, query));
  }

  @Get('hierarchy')
  @Permissions(PermissionKeys.EquipmentRead)
  hierarchy(@CurrentUser() user: RequestUser, @Query('rootId') rootId?: string) {
    return this.equipment.hierarchy(user.tenantId, rootId, user.siteIds, user.selectedSiteId);
  }

  @Get(':id')
  @Permissions(PermissionKeys.EquipmentRead)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.get(user.tenantId, id, user.siteIds);
  }

  @Get(':id/documents')
  @Permissions(PermissionKeys.EquipmentRead)
  documents(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.documents(user.tenantId, id, user.siteIds);
  }

  @Get(':id/attachments')
  @Permissions(PermissionKeys.EquipmentRead)
  attachments(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.attachments(user.tenantId, id);
  }

  @Get(':id/linked-records')
  @Permissions(PermissionKeys.EquipmentRead)
  linkedRecords(@CurrentUser() user: RequestUser, @Param('id') id: string, @Query('moduleKey') moduleKey?: string) {
    return this.equipment.linkedRecords(user.tenantId, id, moduleKey);
  }

  @Get(':id/actions')
  @Permissions(PermissionKeys.EquipmentRead)
  actions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.actions(user.tenantId, id, user.siteIds);
  }

  @Patch(':id/actions/:actionId')
  @Permissions(PermissionKeys.ActionsManage)
  updateActionStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('actionId') actionId: string, @Body('status') status: string) {
    return this.equipment.updateActionStatus(user.tenantId, user.id, id, actionId, status);
  }

  @Get(':id/inspections')
  @Permissions(PermissionKeys.EquipmentRead)
  inspections(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.inspectionHistory(user.tenantId, id);
  }

  @Get(':id/hierarchy')
  @Permissions(PermissionKeys.EquipmentRead)
  equipmentHierarchy(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.hierarchyForEquipment(user.tenantId, id);
  }

  @Get(':id/timeline')
  @Permissions(PermissionKeys.EquipmentRead)
  timeline(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.timeline(user.tenantId, id);
  }

  @Get(':id/cross-module-summary')
  @Permissions(PermissionKeys.EquipmentRead)
  crossModuleSummary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.crossModuleSummary(user.tenantId, id);
  }

  @Get(':id/summary')
  @Permissions(PermissionKeys.EquipmentRead)
  summary(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.crossModuleSummary(user.tenantId, id);
  }

  @Get(':id/qr')
  @Permissions(PermissionKeys.EquipmentRead)
  qrCode(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.qrCode(user.tenantId, id);
  }

  @Post()
  @Permissions(PermissionKeys.EquipmentManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateEquipmentDto) {
    return this.equipment.create(user.tenantId, user.id, { ...dto, siteId: this.requiredSiteId(user, dto.siteId) });
  }

  @Post('bulk-import')
  @Permissions(PermissionKeys.EquipmentManage)
  bulkImport(@CurrentUser() user: RequestUser, @Body() dto: BulkImportDto) {
    return this.equipment.bulkImport(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  @Permissions(PermissionKeys.EquipmentManage)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipment.update(user.tenantId, user.id, id, dto, user.siteIds);
  }

  @Post(':id/children')
  @Permissions(PermissionKeys.EquipmentManage)
  createChild(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateEquipmentDto) {
    return this.equipment.createChild(user.tenantId, user.id, id, { ...dto, siteId: this.requiredSiteId(user, dto.siteId) }, user.siteIds);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.EquipmentManage)
  uploadDocument(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UploadEquipmentDocumentDto,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ) {
    return this.equipment.uploadDocument(user.tenantId, user.id, id, dto, file);
  }

  @Patch(':id/documents/:documentId')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.EquipmentManage)
  replaceDocument(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: UploadEquipmentDocumentDto,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ) {
    return this.equipment.replaceDocument(user.tenantId, user.id, id, documentId, dto, file);
  }

  @Get(':id/documents/:documentId/file')
  @Permissions(PermissionKeys.EquipmentRead)
  async documentFile(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string, @Res() response: any) {
    const file = await this.equipment.documentFile(user.tenantId, id, documentId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`);
    response.send(file.buffer);
  }

  @Delete(':id/documents/:documentId')
  @Permissions(PermissionKeys.EquipmentManage)
  deleteDocument(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('documentId') documentId: string) {
    return this.equipment.deleteDocument(user.tenantId, user.id, id, documentId);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.EquipmentManage)
  uploadAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UploadEquipmentAttachmentDto,
    @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ) {
    return this.equipment.uploadAttachment(user.tenantId, user.id, id, dto, file);
  }

  @Delete(':id/attachments/:attachmentId')
  @Permissions(PermissionKeys.EquipmentManage)
  deleteAttachment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.equipment.deleteAttachment(user.tenantId, user.id, id, attachmentId);
  }

  @Get(':id/attachments/:attachmentId/file')
  @Permissions(PermissionKeys.EquipmentRead)
  async attachmentFile(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('attachmentId') attachmentId: string, @Res() response: any) {
    const file = await this.equipment.attachmentFile(user.tenantId, id, attachmentId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`);
    response.send(file.buffer);
  }

  @Post(':id/qr-code')
  @Permissions(PermissionKeys.EquipmentManage)
  generateQrCode(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.generateQrCode(user.tenantId, user.id, id);
  }

  @Post(':id/qr')
  @Permissions(PermissionKeys.EquipmentManage)
  generateQr(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.equipment.generateQrCode(user.tenantId, user.id, id);
  }

  @Post(':id/inspections')
  @Permissions(PermissionKeys.EquipmentManage)
  createInspection(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateEquipmentInspectionDto) {
    return this.equipment.createInspection(user.tenantId, user.id, id, dto);
  }

  @Patch(':id/inspections/:inspectionId')
  @Permissions(PermissionKeys.EquipmentManage)
  updateInspection(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('inspectionId') inspectionId: string, @Body() dto: UpdateEquipmentInspectionDto) {
    return this.equipment.updateInspection(user.tenantId, user.id, id, inspectionId, dto);
  }

  @Delete(':id/inspections/:inspectionId')
  @Permissions(PermissionKeys.EquipmentManage)
  deleteInspection(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('inspectionId') inspectionId: string) {
    return this.equipment.deleteInspection(user.tenantId, user.id, id, inspectionId);
  }

  @Post(':id/notes')
  @Permissions(PermissionKeys.EquipmentManage)
  addNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CreateEquipmentNoteDto) {
    return this.equipment.addNote(user.tenantId, user.id, id, dto);
  }

  @Patch(':id/notes/:noteId')
  @Permissions(PermissionKeys.EquipmentManage)
  updateNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('noteId') noteId: string, @Body() dto: UpdateEquipmentNoteDto) {
    return this.equipment.updateNote(user.tenantId, user.id, id, noteId, dto);
  }

  @Delete(':id/notes/:noteId')
  @Permissions(PermissionKeys.EquipmentManage)
  deleteNote(@CurrentUser() user: RequestUser, @Param('id') id: string, @Param('noteId') noteId: string) {
    return this.equipment.deleteNote(user.tenantId, user.id, id, noteId);
  }

  private scopedFilter(user: RequestUser, query: EquipmentFilterDto) {
    const siteId = user.selectedSiteId ?? query.siteId;
    if (siteId && user.siteIds.length && !user.siteIds.includes(siteId)) {
      return { ...query, siteId: '__forbidden__' };
    }
    return user.corporateView && !siteId ? query : { ...query, siteId };
  }

  private requiredSiteId(user: RequestUser, siteId?: string) {
    const nextSiteId = siteId ?? user.selectedSiteId;
    if (!nextSiteId) throw new BadRequestException('Site is required for equipment records');
    if (user.siteIds.length && !user.siteIds.includes(nextSiteId)) return '__forbidden__';
    return nextSiteId;
  }
}
