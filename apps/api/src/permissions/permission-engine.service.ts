import { Injectable } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Injectable()
export class PermissionEngineService {
  constructor(private readonly permissions: PermissionsService) {}

  check(userId: string, tenantId: string, permission: string) {
    return this.permissions.check(userId, tenantId, permission);
  }
}
