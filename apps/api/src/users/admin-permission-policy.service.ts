import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminPermissionPolicyService {
  assertCanAssignRole(actorRoleKeys: string[], targetRoleKey: string) {
    const protectedRoles = new Set(['super_admin', 'platform_admin']);
    if (protectedRoles.has(targetRoleKey) && !actorRoleKeys.some((role) => protectedRoles.has(role))) {
      throw new ForbiddenException('Only super administrators can assign protected roles');
    }
  }
}
