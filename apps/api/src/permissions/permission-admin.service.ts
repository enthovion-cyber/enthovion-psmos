import { Injectable } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Injectable()
export class PermissionAdminService {
  constructor(private readonly permissions: PermissionsService) {}

  listForUser(userId: string, tenantId: string) {
    return this.permissions.effectiveForUser(userId, tenantId);
  }
}
