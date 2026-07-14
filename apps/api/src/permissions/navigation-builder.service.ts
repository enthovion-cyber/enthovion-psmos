import { Injectable } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Injectable()
export class NavigationBuilderService {
  constructor(private readonly permissions: PermissionsService) {}

  build(userId: string, tenantId: string) {
    return this.permissions.navigationForUser(userId, tenantId);
  }
}
