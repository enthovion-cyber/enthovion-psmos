import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { SignatureProfileDto } from './dto/signature-profile.dto';
import { ChangeSignaturePinDto, SetSignaturePinDto, VerifySignaturePinDto } from './dto/signature-pin.dto';
import { RejectElectronicSignatureDto, SignElectronicSignatureDto, SignatureRequirementDto, ValidateBeforeActionDto } from './dto/signature.dto';
import { SignaturesService } from './signatures.service';

@ApiTags('signatures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class SignaturesController {
  constructor(private readonly signatures: SignaturesService) {}

  @Get('users/me/signature-profile')
  @Permissions(PermissionKeys.SignatureProfileView)
  myProfile(@CurrentUser() user: RequestUser) {
    return this.signatures.myProfile(user.tenantId, user.id);
  }

  @Post('users/me/signature-profile')
  @Permissions(PermissionKeys.SignatureProfileCreate)
  createProfile(@CurrentUser() user: RequestUser, @Body() dto: SignatureProfileDto) {
    return this.signatures.saveMyProfile(user.tenantId, user.id, dto);
  }

  @Patch('users/me/signature-profile')
  @Permissions(PermissionKeys.SignatureProfileEdit)
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: SignatureProfileDto) {
    return this.signatures.saveMyProfile(user.tenantId, user.id, dto);
  }

  @Post('users/me/signature-profile/verify')
  @Permissions(PermissionKeys.SignatureProfileEdit)
  verifyProfile(@CurrentUser() user: RequestUser) {
    return this.signatures.verifyMyProfile(user.tenantId, user.id);
  }

  @Post('users/me/signature-profile/disable')
  @Permissions(PermissionKeys.SignatureProfileDisable)
  disableProfile(@CurrentUser() user: RequestUser) {
    return this.signatures.disableMyProfile(user.tenantId, user.id);
  }

  @Get('users/me/signature-profile/versions')
  @Permissions(PermissionKeys.SignatureProfileView)
  versions(@CurrentUser() user: RequestUser) {
    return this.signatures.versions(user.tenantId, user.id);
  }

  @Get('admin/users/:userId/signature-profile/status')
  @Permissions(PermissionKeys.UsersRead)
  adminProfileStatus(@CurrentUser() user: RequestUser, @Param('userId') userId: string) {
    return this.signatures.adminProfileStatus(user.tenantId, userId);
  }

  @Post('users/me/signature-pin/set')
  @Permissions(PermissionKeys.SignaturePinSet)
  setPin(@CurrentUser() user: RequestUser, @Body() dto: SetSignaturePinDto) {
    return this.signatures.setPin(user.tenantId, user.id, dto);
  }

  @Post('users/me/signature-pin/change')
  @Permissions(PermissionKeys.SignaturePinChange)
  changePin(@CurrentUser() user: RequestUser, @Body() dto: ChangeSignaturePinDto) {
    return this.signatures.changePin(user.tenantId, user.id, dto);
  }

  @Post('users/me/signature-pin/verify')
  @Permissions(PermissionKeys.SignaturePinVerify)
  verifyPin(@CurrentUser() user: RequestUser, @Body() dto: VerifySignaturePinDto) {
    return this.signatures.verifyPin(user.tenantId, user.id, dto);
  }

  @Post('users/me/signature-pin/reset-request')
  @Permissions(PermissionKeys.SignaturePinChange)
  resetPin(@CurrentUser() user: RequestUser, @Body() dto: SetSignaturePinDto) {
    return this.signatures.setPin(user.tenantId, user.id, dto);
  }

  @Get('signatures/requirements')
  @Permissions(PermissionKeys.SignatureView)
  requirements(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.signatures.requirements(user.tenantId, query);
  }

  @Post('signatures/requirements')
  @Permissions(PermissionKeys.SignatureRequirementsManage)
  createRequirement(@CurrentUser() user: RequestUser, @Body() dto: SignatureRequirementDto) {
    return this.signatures.createRequirement(user.tenantId, user.id, dto);
  }

  @Patch('signatures/requirements/:id')
  @Permissions(PermissionKeys.SignatureRequirementsManage)
  updateRequirement(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: Partial<SignatureRequirementDto>) {
    return this.signatures.updateRequirement(user.tenantId, user.id, id, dto);
  }

  @Delete('signatures/requirements/:id')
  @Permissions(PermissionKeys.SignatureRequirementsManage)
  deleteRequirement(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.signatures.deleteRequirement(user.tenantId, user.id, id);
  }

  @Get('signatures/records')
  @Permissions(PermissionKeys.SignatureView)
  records(@CurrentUser() user: RequestUser) {
    return this.signatures.records(user.tenantId);
  }

  @Get('signatures/records/:id')
  @Permissions(PermissionKeys.SignatureView)
  record(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.signatures.record(user.tenantId, id);
  }

  @Get('signatures/for-record')
  @Permissions(PermissionKeys.SignatureView)
  forRecord(@CurrentUser() user: RequestUser, @Query('module_name') moduleName: string, @Query('record_type') recordType: string, @Query('record_id') recordId: string) {
    return this.signatures.forRecord(user.tenantId, moduleName, recordType, recordId);
  }

  @Post('signatures/sign')
  @Permissions(PermissionKeys.SignatureSign)
  sign(@CurrentUser() user: RequestUser, @Body() dto: SignElectronicSignatureDto, @Req() req: any) {
    return this.signatures.sign(user.tenantId, user.id, dto, { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] });
  }

  @Post('signatures/reject')
  @Permissions(PermissionKeys.SignatureReject)
  reject(@CurrentUser() user: RequestUser, @Body() dto: RejectElectronicSignatureDto, @Req() req: any) {
    return this.signatures.reject(user.tenantId, user.id, dto, { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] });
  }

  @Post('signatures/verify-intent')
  @Permissions(PermissionKeys.SignatureSign)
  verifyIntent(@CurrentUser() user: RequestUser) {
    return this.signatures.myProfile(user.tenantId, user.id);
  }

  @Post('signatures/validate-before-action')
  @Permissions(PermissionKeys.SignatureView)
  validateBeforeAction(@CurrentUser() user: RequestUser, @Body() dto: ValidateBeforeActionDto) {
    return this.signatures.validateBeforeAction(user.tenantId, dto);
  }
}
