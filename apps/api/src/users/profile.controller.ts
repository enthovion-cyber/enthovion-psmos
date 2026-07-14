import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountDangerZoneService } from './account-danger-zone.service';
import { SettingsNavigationService } from './settings-navigation.service';
import { UserMenuService } from './user-menu.service';
import { UsersService } from './users.service';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly users: UsersService,
    private readonly userMenu: UserMenuService,
    private readonly settingsNavigation: SettingsNavigationService,
    private readonly dangerZone: AccountDangerZoneService
  ) {}

  @Get()
  profile(@CurrentUser() user: RequestUser) {
    return this.users.getProfile(user.id);
  }

  @Get('account')
  account(@CurrentUser() user: RequestUser) {
    return this.users.getProfile(user.id);
  }

  @Get('security')
  async security(@CurrentUser() user: RequestUser) {
    const [profile, events] = await Promise.all([this.users.getProfile(user.id), this.users.securityEvents(user.tenantId, user.id)]);
    return {
      loginMethod: {
        passwordEnabled: true,
        googleConnected: false,
        ssoOnly: false
      },
      connectedAccounts: [],
      activeSessions: [],
      securityEvents: events,
      user: profile
    };
  }

  @Get('sessions')
  sessions(@CurrentUser() user: RequestUser) {
    return { currentSession: { userId: user.id, tenantId: user.tenantId, current: true }, sessions: [] };
  }

  @Post('sessions/:sessionId/revoke')
  revokeSession(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return { success: true, sessionId, userId: user.id, message: 'Session revoke requested. Provider session revocation is handled by the active auth provider when available.' };
  }

  @Get('e-signature')
  eSignature(@CurrentUser() user: RequestUser) {
    return { userId: user.id, profileUrl: '/profile/e-signature' };
  }

  @Patch('e-signature')
  eSignaturePatch(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return { userId: user.id, saved: true, body };
  }

  @Get('notifications')
  notifications(@CurrentUser() user: RequestUser) {
    void user;
    return { email: true, inApp: true, modules: {}, quietHours: null };
  }

  @Patch('notifications')
  notificationsPatch(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    void user;
    return { ...body, saved: true };
  }

  @Post('avatar')
  avatar(@CurrentUser() user: RequestUser, @Body() body: { avatarUrl?: string; fileName?: string; mimeType?: string; sizeBytes?: number }) {
    return this.users.updateOwnProfile(user.tenantId, user.id, { avatarUrl: body.avatarUrl } as any);
  }

  @Get('danger-zone/requests')
  dangerRequests(@CurrentUser() user: RequestUser) {
    return this.dangerZone.myRequests(user.id);
  }

  @Post('delete-request')
  deleteRequest(@CurrentUser() user: RequestUser, @Body() body: { reason?: string; confirmationText?: string; companyId?: string }) {
    return this.dangerZone.createRequest(user.tenantId, user.id, { requestType: 'delete', ...body });
  }

  @Post('deactivate-request')
  deactivateRequest(@CurrentUser() user: RequestUser, @Body() body: { reason?: string; confirmationText?: string; companyId?: string }) {
    return this.dangerZone.createRequest(user.tenantId, user.id, { requestType: 'deactivate', ...body });
  }

  @Patch()
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: Record<string, unknown>) {
    return this.users.updateOwnProfile(user.tenantId, user.id, dto as any);
  }

  @Post('change-password')
  changePassword(@CurrentUser() user: RequestUser, @Body() dto: { currentPassword?: string; newPassword: string }) {
    return this.users.changeOwnPassword(user.tenantId, user.id, dto.currentPassword, dto.newPassword);
  }

  @Get('security-events')
  securityEvents(@CurrentUser() user: RequestUser) {
    return this.users.securityEvents(user.tenantId, user.id);
  }

  @Get('invitations')
  invitations(@CurrentUser() user: RequestUser) {
    return this.users.profileInvitations(user.tenantId, user.id);
  }

  @Post('invitations/:id/accept')
  acceptInvitation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.users.acceptProfileInvitation(user.tenantId, user.id, id);
  }

  @Post('invitations/:id/decline')
  declineInvitation(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.users.declineProfileInvitation(user.tenantId, user.id, id, body?.reason);
  }
}
