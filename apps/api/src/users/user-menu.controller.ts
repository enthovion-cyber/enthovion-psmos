import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SettingsNavigationService } from './settings-navigation.service';
import { UserMenuService } from './user-menu.service';

@ApiTags('current-user-menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UserMenuController {
  constructor(
    private readonly userMenu: UserMenuService,
    private readonly settingsNavigation: SettingsNavigationService
  ) {}

  @Get('auth/me/sidebar-profile')
  sidebarProfile(@CurrentUser() user: RequestUser) {
    return this.userMenu.sidebarProfile(user.id, user.tenantId);
  }

  @Get('settings/navigation')
  settingsNavigationRoute(@CurrentUser() user: RequestUser) {
    return this.settingsNavigation.navigation(user.id, user.tenantId);
  }

  @Get('settings/general')
  generalSettings(@CurrentUser() user: RequestUser) {
    return this.settingsNavigation.general(user.id, user.tenantId);
  }

  @Patch('settings/general')
  saveGeneralSettings(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.settingsNavigation.saveGeneral(user.id, user.tenantId, body);
  }

  @Get('settings/access-summary')
  accessSummary(@CurrentUser() user: RequestUser) {
    return this.settingsNavigation.accessSummary(user.id, user.tenantId);
  }

  @Get('help/navigation')
  helpNavigation() {
    return {
      sections: [
        {
          key: 'support',
          label: 'Support',
          cards: [
            { key: 'help', label: 'Help Center', href: '/help', description: 'Common support resources.' },
            { key: 'documentation', label: 'Documentation', href: '/help/documentation', description: 'Product documentation and guides.' },
            { key: 'contact', label: 'Contact Support', href: '/help/contact', description: 'Contact support for workspace help.' },
            { key: 'shortcuts', label: 'Keyboard Shortcuts', href: '/help/shortcuts', description: 'Keyboard shortcuts and command palette help.' },
            { key: 'release-notes', label: 'Release Notes', href: '/help/release-notes', description: 'Recent product changes.' }
          ]
        }
      ]
    };
  }
}
