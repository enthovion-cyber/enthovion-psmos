import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { AccountDangerZoneService } from './account-danger-zone.service';
import { AdminInvitationsController } from './admin-invitations.controller';
import { AuthInvitationsController } from './auth-invitations.controller';
import { MeController } from './me.controller';
import { ProfileController } from './profile.controller';
import { SettingsNavigationService } from './settings-navigation.service';
import { UserMenuService } from './user-menu.service';
import { UserMenuController } from './user-menu.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SupabaseModule, PermissionsModule, AuditModule, NotificationsModule, SearchModule],
  controllers: [UsersController, MeController, ProfileController, UserMenuController, AdminInvitationsController, AuthInvitationsController],
  providers: [UsersService, UserMenuService, SettingsNavigationService, AccountDangerZoneService],
  exports: [UsersService]
})
export class UsersModule {}
