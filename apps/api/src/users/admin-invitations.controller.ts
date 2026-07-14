import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { UsersService } from './users.service';

@ApiTags('admin invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/invitations')
export class AdminInvitationsController {
  constructor(private readonly users: UsersService) {}

  @Post(':invitationId/resend')
  @Permissions(PermissionKeys.UsersInvite)
  resend(@CurrentUser() user: RequestUser, @Param('invitationId') invitationId: string) {
    return this.users.resendInvitationById(user.tenantId, user.id, invitationId);
  }
}
