import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SiteGuard } from '../common/guards/site.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  @Permissions(PermissionKeys.NotificationsView)
  list(@CurrentUser() user: RequestUser, @Query() query: NotificationFilterDto) {
    return this.notifications.inbox(user.id, user.tenantId, this.scope(user), query);
  }

  @Get('notifications/unread-count')
  @Permissions(PermissionKeys.NotificationsView)
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notifications.unreadCount(user.id, user.tenantId, this.scope(user));
  }

  @Get('notifications/:id')
  @Permissions(PermissionKeys.NotificationsView)
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.get(user.id, user.tenantId, id, this.scope(user));
  }

  @Post('notifications')
  @Permissions(PermissionKeys.NotificationsManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateNotificationDto) {
    return this.notifications.createFromApi(user.tenantId, user.id, dto, this.scope(user));
  }

  @Patch('notifications/:id/read')
  @Permissions(PermissionKeys.NotificationsView)
  markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, user.tenantId, id, this.scope(user));
  }

  @Patch('notifications/read-all')
  @Permissions(PermissionKeys.NotificationsView)
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user.id, user.tenantId, this.scope(user));
  }

  @Patch('notifications/:id/archive')
  @Permissions(PermissionKeys.NotificationsView)
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.archive(user.id, user.tenantId, id, this.scope(user));
  }

  @Delete('notifications/:id')
  @Permissions(PermissionKeys.NotificationsView)
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.delete(user.id, user.tenantId, id, this.scope(user));
  }

  @Get('notification-preferences')
  @Permissions(PermissionKeys.NotificationsPreferences)
  preferences(@CurrentUser() user: RequestUser) {
    return this.notifications.preferences(user.id, user.tenantId);
  }

  @Patch('notification-preferences')
  @Permissions(PermissionKeys.NotificationsPreferences)
  updatePreferences(@CurrentUser() user: RequestUser, @Body() dto: UpdatePreferencesDto) {
    return this.notifications.updatePreferences(user.id, user.tenantId, user.id, dto);
  }

  @Post('notifications/test-email')
  @Permissions(PermissionKeys.NotificationsTest)
  testEmail(@CurrentUser() user: RequestUser) {
    return this.notifications.testEmail(user.id, user.tenantId, user.id);
  }

  @Post('notifications/test-sms')
  @Permissions(PermissionKeys.NotificationsTest)
  testSms(@CurrentUser() user: RequestUser) {
    return this.notifications.testSms(user.id, user.tenantId, user.id);
  }

  @Get('notifications/digest/daily-preview')
  @Permissions(PermissionKeys.NotificationsView)
  dailyPreview(@CurrentUser() user: RequestUser) {
    return this.notifications.dailyDigestPreview(user.id, user.tenantId);
  }

  @Get('notifications/digest/weekly-preview')
  @Permissions(PermissionKeys.NotificationsView)
  weeklyPreview(@CurrentUser() user: RequestUser) {
    return this.notifications.weeklyDigestPreview(user.id, user.tenantId);
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }
}
