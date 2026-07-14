import { Injectable } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Injectable()
export class EffectivePermissionService {
  constructor(private readonly permissions: PermissionsService) {}

  resolve(userId: string, tenantId: string) {
    return this.permissions.effectiveForUser(userId, tenantId);
  }
}
