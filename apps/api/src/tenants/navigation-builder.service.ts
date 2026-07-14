import { Injectable } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class NavigationBuilderService {
  constructor(private readonly permissions: PermissionsService) {}

  forUser(userId: string, tenantId: string) {
    return this.permissions.navigationForUser(userId, tenantId);
  }
}
