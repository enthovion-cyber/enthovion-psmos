import { Injectable, ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ExecutivePerformancePermissionService {
  require(user: RequestUser, permission: string) {
    const permissions = new Set(user.permissions ?? []);
    if (!permissions.has(permission) && !permissions.has('executive.admin')) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }
}
