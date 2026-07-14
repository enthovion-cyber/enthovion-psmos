import { Injectable } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class PermissionGuardService {
  constructor(private readonly permissions: PermissionsService) {}

  async can(userId: string, tenantId: string, permission: string) {
    const result = await this.permissions.check(userId, tenantId, permission);
    return result.allowed;
  }
}
