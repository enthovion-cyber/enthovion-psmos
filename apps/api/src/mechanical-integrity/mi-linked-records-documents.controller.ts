import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { MiLinkedRecordsDocumentsService } from './mi-linked-records-documents.service';

type QueryMap = Record<string, string | undefined>;

function sendCsv(response: any, payload: { fileName: string; content: string }) {
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
  return response.send(payload.content);
}

@ApiTags('mechanical-integrity-linked-records-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller('mechanical-integrity')
export class MiLinkedRecordsDocumentsController {
  constructor(private readonly service: MiLinkedRecordsDocumentsService) {}

  @Get('linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  linkedRecords(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.linkedRecords(user, query); }

  @Post('linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordCreate)
  createLinkedRecord(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.createLinkedRecord(user, body); }

  @Get('linked-records/import-template')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordExport)
  importTemplate(@Res() response: any) { return sendCsv(response, this.service.importTemplate()); }

  @Post('linked-records/import')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordCreate)
  importRows(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.importRows(user, body); }

  @Get('linked-records/export')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordExport)
  async exportLinkedRecords(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) { return sendCsv(response, await this.service.exportLinkedRecords(user, query)); }

  @Get('linked-records/search-targets')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  searchTargets(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.searchTargets(user, query); }

  @Get('linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  linkedRecord(@CurrentUser() user: RequestUser, @Param('linkId') linkId: string) { return this.service.linkedRecord(user, linkId); }

  @Patch('linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordEdit)
  updateLinkedRecord(@CurrentUser() user: RequestUser, @Param('linkId') linkId: string, @Body() body: Record<string, any>) { return this.service.updateLinkedRecord(user, linkId, body); }

  @Delete('linked-records/:linkId')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordRemove)
  removeLinkedRecord(@CurrentUser() user: RequestUser, @Param('linkId') linkId: string) { return this.service.removeLinkedRecord(user, linkId); }

  @Get('documents')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  documents(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.documentsDashboard(user, query); }

  @Post('documents/link')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkCreate)
  linkDocument(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.linkDocument(user, body); }

  @Post('documents/upload-and-link')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkCreate)
  uploadAndLink(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>, @UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    return this.service.uploadAndLinkDocument(user, body, file);
  }

  @Get('documents/search')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  documentSearch(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.documentSearch(user, query); }

  @Get('documents/requirements')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementView)
  requirements(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.requirements(user, query); }

  @Post('documents/requirements')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementManage)
  createRequirement(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.createRequirement(user, body); }

  @Patch('documents/requirements/:requirementId')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementManage)
  updateRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() body: Record<string, any>) { return this.service.updateRequirement(user, requirementId, body); }

  @Post('documents/requirements/:requirementId/archive')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementManage)
  archiveRequirement(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string) { return this.service.archiveRequirement(user, requirementId); }

  @Post('documents/evaluate-requirements')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementEvaluate)
  evaluateRequirements(@CurrentUser() user: RequestUser, @Body() body: Record<string, any>) { return this.service.evaluateRequirements(user, body); }

  @Get('documents/missing')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementView)
  missingDocuments(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.missingDocuments(user, query); }

  @Get('documents/expired')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  expiredDocuments(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.expiredDocuments(user, query); }

  @Get('documents/pending-approval')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  pendingApproval(@CurrentUser() user: RequestUser, @Query() query: QueryMap) { return this.service.pendingApprovalDocuments(user, query); }

  @Get('documents/export')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkExport)
  async exportDocuments(@CurrentUser() user: RequestUser, @Query() query: QueryMap, @Res() response: any) { return sendCsv(response, await this.service.exportDocuments(user, query)); }

  @Get('documents/:documentLinkId')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  documentDetail(@CurrentUser() user: RequestUser, @Param('documentLinkId') documentLinkId: string) { return this.service.documentDetail(user, documentLinkId); }

  @Delete('documents/:documentLinkId')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkRemove)
  removeDocument(@CurrentUser() user: RequestUser, @Param('documentLinkId') documentLinkId: string, @Body() body: Record<string, any>) { return this.service.removeDocumentLink(user, documentLinkId, body); }

  @Post('documents/requirements/:requirementId/request-waiver')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementWaive)
  requestWaiver(@CurrentUser() user: RequestUser, @Param('requirementId') requirementId: string, @Body() body: Record<string, any>) { return this.service.requestWaiver(user, requirementId, body); }

  @Post('documents/waivers/:waiverId/approve')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementApproveWaiver)
  approveWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() body: Record<string, any>) { return this.service.decideWaiver(user, waiverId, 'approve', body); }

  @Post('documents/waivers/:waiverId/reject')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementApproveWaiver)
  rejectWaiver(@CurrentUser() user: RequestUser, @Param('waiverId') waiverId: string, @Body() body: Record<string, any>) { return this.service.decideWaiver(user, waiverId, 'reject', body); }

  @Get('equipment/:equipmentId/linked-records-v2')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  equipmentLinkedRecordsV2(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.service.equipmentLinkedRecords(user, equipmentId, query); }

  @Get('equipment/:equipmentId/documents-v2')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  equipmentDocumentsV2(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Query() query: QueryMap) { return this.service.equipmentDocuments(user, equipmentId, query); }

  @Post('equipment/:equipmentId/documents/evaluate-requirements')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentRequirementEvaluate)
  evaluateEquipmentRequirements(@CurrentUser() user: RequestUser, @Param('equipmentId') equipmentId: string, @Body() body: Record<string, any>) { return this.service.evaluateRequirements(user, { ...body, equipmentId, sourceModule: 'Equipment', sourceRecordId: equipmentId }); }

  @Get('lookups/linked-record-types')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  linkedRecordTypes() { return this.service.lookups().linkedRecordTypes; }

  @Get('lookups/relationship-types')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  relationshipTypes() { return this.service.lookups().relationshipTypes; }

  @Get('lookups/document-types')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  documentTypes() { return this.service.lookups().documentTypes; }

  @Get('lookups/document-link-statuses')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  documentStatuses() { return this.service.lookups().documentLinkStatuses; }

  @Get(':module/:recordId/linked-records')
  @Permissions(PermissionKeys.MechanicalIntegrityLinkedRecordView)
  moduleLinkedRecords(@CurrentUser() user: RequestUser, @Param('module') module: string, @Param('recordId') recordId: string) { return this.service.moduleLinkedRecords(user, module, recordId); }

  @Get(':module/:recordId/documents')
  @Permissions(PermissionKeys.MechanicalIntegrityDocumentLinkView)
  moduleDocuments(@CurrentUser() user: RequestUser, @Param('module') module: string, @Param('recordId') recordId: string) { return this.service.moduleDocuments(user, module, recordId); }
}
